"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePreprocess = handlePreprocess;
const preprocessor_1 = require("../agents/preprocessor");
async function handlePreprocess(req, res) {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            res.status(400).json({
                error: 'Missing required field: prompt',
            });
            return;
        }
        // Call Pre-processor agent
        const result = await (0, preprocessor_1.preprocessPrompt)(prompt);
        if (!result.success) {
            res.status(400).json({
                error: result.error,
                suggestions: result.data?.validation.warnings || [],
            });
            return;
        }
        res.json(result.data);
    }
    catch (error) {
        console.error('Preprocess endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=preprocess.js.map