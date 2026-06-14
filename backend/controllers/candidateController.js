const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const { extractTextFromPDF, extractSkills, virusCheck } = require('../services/pdfService');
const eventEmitter = require('../services/eventEmitter');

function parseArrayField(value, fallback = []) {
  if (value === undefined || value === null || value === '') return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return JSON.parse(value);
  return fallback;
}

function logAudit({ user, action, resource, resourceId, changes, req }) {
  return AuditLog.create({
    user,
    action,
    resource,
    resourceId,
    changes,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    correlationId: req.correlationId
  });
}

async function processResumeUpload(file, existingSkills = []) {
  const isSafe = await virusCheck(file.path);
  if (!isSafe) throw Object.assign(new Error('Resume failed security scan (malware detected).'), { status: 400 });

  const extractedText = await extractTextFromPDF(file.path);
  const extractedSkills = extractSkills(extractedText);

  return {
    resume: { filename: file.filename, path: file.path, uploadedAt: new Date(), extractedText },
    skills: [...new Set([...existingSkills, ...extractedSkills])]
  };
}

exports.getCandidates = async (req, res) => {
  try {
    const { search, status, location, seniority, page = 1, limit = 10, cursor } = req.query;

    const query = {
      ...(search && { $text: { $search: search } }),
      ...(status && { status }),
      ...(location && { location }),
      ...(seniority && { seniority }),
    };

    const countQuery = { ...query };
    const limitVal = parseInt(limit);
    let candidates;
    let hasMore = false;
    let nextCursor = null;

    // Cursor pagination is incompatible with $text search — fall back to offset when searching
    if (cursor && !search) {
      const cursorDoc = await Candidate.findById(cursor);
      if (cursorDoc) {
        query.$or = [
          { createdAt: { $lt: cursorDoc.createdAt } },
          { createdAt: cursorDoc.createdAt, _id: { $lt: cursorDoc._id } }
        ];
      }
      candidates = await Candidate.find(query).sort({ createdAt: -1, _id: -1 }).limit(limitVal + 1);
    } else {
      const skip = (parseInt(page) - 1) * limitVal;
      candidates = await Candidate.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limitVal + 1);
    }

    if (candidates.length > limitVal) {
      hasMore = true;
      nextCursor = candidates[limitVal - 1]._id.toString();
      candidates.pop();
    }

    const total = await Candidate.countDocuments(countQuery);

    res.json({
      success: true,
      data: {
        candidates,
        pagination: { page: parseInt(page), limit: limitVal, total, pages: Math.ceil(total / limitVal), nextCursor, hasMore }
      }
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error fetching candidates' });
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    res.json({ success: true, data: candidate });
  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error fetching candidate' });
  }
};

exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone, skills, experience, status, location, seniority } = req.body;

    const manualSkills = parseArrayField(skills);
    let resumeData = {};
    let allSkills = manualSkills;

    if (req.file) {
      const processed = await processResumeUpload(req.file, manualSkills);
      resumeData = processed.resume;
      allSkills = processed.skills;
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      skills: allSkills,
      experience: parseArrayField(experience),
      status: status || 'Active',
      resume: resumeData,
      location,
      seniority,
      timeline: [{ event: 'Created', description: 'Candidate profile created' }]
    });

    await logAudit({ user: req.user._id, action: 'CREATE', resource: 'Candidate', resourceId: candidate._id, changes: { after: candidate }, req });

    res.status(201).json({ success: true, data: candidate });

  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, error: error.message });
    console.error('Create candidate error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error creating candidate' });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });

    const oldState = candidate.toObject();
    const { name, email, phone, skills, experience, status, location, seniority } = req.body;

    if (name) candidate.name = name;
    if (email) candidate.email = email;
    if (phone) candidate.phone = phone;
    if (skills !== undefined) candidate.skills = parseArrayField(skills);
    if (experience !== undefined) candidate.experience = parseArrayField(experience);
    if (status) candidate.status = status;
    if (location !== undefined) candidate.location = location;
    if (seniority !== undefined) candidate.seniority = seniority;

    if (req.file) {
      const processed = await processResumeUpload(req.file, candidate.skills);
      candidate.resume = processed.resume;
      candidate.skills = processed.skills;
    }

    candidate.timeline.push({ event: 'Updated', description: 'Candidate profile updated' });
    await candidate.save();

    await logAudit({ user: req.user._id, action: 'UPDATE', resource: 'Candidate', resourceId: candidate._id, changes: { before: oldState, after: candidate.toObject() }, req });

    res.json({ success: true, data: candidate });

    eventEmitter.emit('candidate:updated', { candidateId: candidate._id });

  } catch (error) {
    if (error.status === 400) return res.status(400).json({ success: false, error: error.message });
    console.error('Update candidate error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error updating candidate' });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });

    const deletedData = candidate.toObject();
    await candidate.deleteOne();
    await logAudit({ user: req.user._id, action: 'DELETE', resource: 'Candidate', resourceId: candidate._id, changes: { before: deletedData }, req });

    res.json({ success: true, message: 'Candidate deleted successfully' });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ success: false, error: error.message || 'Error deleting candidate' });
  }
};
