const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    candidateId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    jobId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    stage: {
        type: String,
        enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
        default: 'Applied'
    },
    notes: String,
    timeline: [{
        stage: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Index to prevent duplicate applications for the same candidate and job
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

applicationSchema.post('save', async function(doc) {
    if (this.isNew) {
        try{
            const Workflow = mongoose.model('Workflow');

            const workflows = await Workflow.find({
                enabled: true,
                'trigger.event': 'Application.created'
            });

            if (workflows.length > 0) {
                console.log(`Found ${workflows.length} workflow(s) to trigger for application ${doc._id}`);
            }
        } catch (error) {
            console.error('Error triggering workflows:', error);
        }
    }
});

applicationSchema.post('findOneAndUpdate', async function(doc) {
    if(doc && this._update && this._update.stage){
        try{
            const Workflow = mongoose.model('Workflow');

            const workflows = await Workflow.find({
                enabled: true,
                'triggers.event': 'Stage.changed'
            });

            if (workflows.length > 0) {
                console.log(`Found ${workflows.length} workflow(s) for stage change`);
            }
        }
            catch (error) {
                console.error('Error triggering workflows on stage change:', error);
            }
        }
});

module.exports = mongoose.model('Application', applicationSchema);