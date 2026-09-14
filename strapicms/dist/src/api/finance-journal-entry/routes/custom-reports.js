"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/finance-reports/generate',
            handler: 'finance-journal-entry.generateStatement',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
