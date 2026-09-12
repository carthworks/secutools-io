'use client';

import { useState } from 'react';
import {
    Wand2,
    Plus,
    Trash2,
    Copy,
    Check,
    Download,
    Upload,
    Save,
    Eye,
    EyeOff,
    Sparkles,
    MessageSquare,
    User,
    Bot,
    Settings,
    FileJson,
    Library
} from 'lucide-react';


type MessageRole = 'system' | 'user' | 'assistant';

type Message = {
    id: string;
    role: MessageRole;
    content: string;
};

type Template = {
    id: string;
    name: string;
    description: string;
    messages: Message[];
    variables: string[];
    category: string;
};

const PRESET_TEMPLATES: Template[] = [
    {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Review code for best practices and suggest improvements',
        category: 'Development',
        variables: ['language', 'code'],
        messages: [
            {
                id: '1',
                role: 'system',
                content: 'You are an expert code reviewer specializing in {{language}}. Provide constructive feedback on code quality, best practices, and potential improvements.'
            },
            {
                id: '2',
                role: 'user',
                content: 'Please review this {{language}} code:\n\n{{code}}'
            }
        ]
    },
    {
        id: 'content-writer',
        name: 'Content Writer',
        description: 'Generate engaging content for various purposes',
        category: 'Writing',
        variables: ['topic', 'tone', 'length'],
        messages: [
            {
                id: '1',
                role: 'system',
                content: 'You are a professional content writer. Create engaging, well-structured content with a {{tone}} tone.'
            },
            {
                id: '2',
                role: 'user',
                content: 'Write a {{length}} article about {{topic}}.'
            }
        ]
    },
    {
        id: 'data-analyst',
        name: 'Data Analyst',
        description: 'Analyze data and provide insights',
        category: 'Analysis',
        variables: ['data_type', 'question'],
        messages: [
            {
                id: '1',
                role: 'system',
                content: 'You are a data analyst expert. Analyze {{data_type}} data and provide clear, actionable insights.'
            },
            {
                id: '2',
                role: 'user',
                content: 'Question: {{question}}'
            }
        ]
    },
    {
        id: 'teacher',
        name: 'Educational Tutor',
        description: 'Explain concepts in simple terms',
        category: 'Education',
        variables: ['subject', 'level', 'concept'],
        messages: [
            {
                id: '1',
                role: 'system',
                content: 'You are a patient and knowledgeable {{subject}} tutor. Explain concepts at a {{level}} level using clear examples and analogies.'
            },
            {
                id: '2',
                role: 'user',
                content: 'Explain {{concept}} to me.'
            }
        ]
    },
    {
        id: 'translator',
        name: 'Language Translator',
        description: 'Translate text between languages',
        category: 'Language',
        variables: ['source_lang', 'target_lang', 'text'],
        messages: [
            {
                id: '1',
                role: 'system',
                content: 'You are a professional translator. Translate accurately from {{source_lang}} to {{target_lang}} while preserving tone and context.'
            },
            {
                id: '2',
                role: 'user',
                content: 'Translate: {{text}}'
            }
        ]
    }
];

export default function PromptTemplatePage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'system', content: '' }
    ]);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    // Extract variables from all messages
    const extractVariables = (): string[] => {
        const variableSet = new Set<string>();
        messages.forEach(msg => {
            const matches = msg.content.match(/\{\{(\w+)\}\}/g);
            if (matches) {
                matches.forEach(match => {
                    const variable = match.replace(/\{\{|\}\}/g, '');
                    variableSet.add(variable);
                });
            }
        });
        return Array.from(variableSet);
    };

    const variables = extractVariables();

    const addMessage = (role: MessageRole) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content: ''
        };
        setMessages([...messages, newMessage]);
    };

    const updateMessage = (id: string, content: string) => {
        setMessages(messages.map(msg =>
            msg.id === id ? { ...msg, content } : msg
        ));
    };

    const deleteMessage = (id: string) => {
        if (messages.length > 1) {
            setMessages(messages.filter(msg => msg.id !== id));
        }
    };

    const loadPreset = (preset: Template) => {
        setMessages(preset.messages);
        setTemplateName(preset.name);
        setTemplateDescription(preset.description);
        setSelectedPreset(preset.id);

        // Initialize preview values
        const initialValues: Record<string, string> = {};
        preset.variables.forEach(v => {
            initialValues[v] = '';
        });
        setPreviewValues(initialValues);
    };

    const clearTemplate = () => {
        setMessages([{ id: Date.now().toString(), role: 'system', content: '' }]);
        setTemplateName('');
        setTemplateDescription('');
        setPreviewValues({});
        setSelectedPreset(null);
    };

    const renderPreview = (content: string): string => {
        let result = content;
        Object.entries(previewValues).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
        });
        return result;
    };

    const exportAsJSON = () => {
        const template = {
            name: templateName || 'Untitled Template',
            description: templateDescription,
            messages: messages.map(({ id, ...rest }) => rest),
            variables,
            created: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateName.toLowerCase().replace(/\s+/g, '-') || 'template'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        const template = {
            name: templateName || 'Untitled Template',
            description: templateDescription,
            messages: messages.map(({ id, ...rest }) => rest),
            variables
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getRoleIcon = (role: MessageRole) => {
        switch (role) {
            case 'system': return <Settings className="w-4 h-4" />;
            case 'user': return <User className="w-4 h-4" />;
            case 'assistant': return <Bot className="w-4 h-4" />;
        }
    };

    const getRoleColor = (role: MessageRole) => {
        switch (role) {
            case 'system': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-200';
            case 'user': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-200';
            case 'assistant': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200';
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto py-2">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md">
                        <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Prompt Template Builder
                    </h1>
                </div>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Create reusable prompt templates with variables for consistent AI interactions
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Panel - Template Library */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-colors">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Template Library
                        </h2>

                        <div className="space-y-2">
                            {PRESET_TEMPLATES.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => loadPreset(preset)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        selectedPreset === preset.id
                                            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-sm'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    }`}
                                >
                                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{preset.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{preset.description}</div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <span className="text-[11px] px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-medium">
                                            {preset.category}
                                        </span>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                            {preset.variables.length} variables
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={clearTemplate}
                            className="w-full mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Template
                        </button>
                    </div>

                    {/* Variables Panel */}
                    {variables.length > 0 && (
                        <div className="p-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-colors">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Variables ({variables.length})
                            </h3>

                            <div className="space-y-3">
                                {variables.map(variable => (
                                    <div key={variable}>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {variable}
                                        </label>
                                        <input
                                            type="text"
                                            value={previewValues[variable] || ''}
                                            onChange={(e) => setPreviewValues({
                                                ...previewValues,
                                                [variable]: e.target.value
                                            })}
                                            placeholder={`Enter ${variable}...`}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm outline-none"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="w-full mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Middle Panel - Template Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Template Info */}
                    <div className="p-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-colors">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Template Name
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g., Code Review Assistant"
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    placeholder="Brief description of what this template does"
                                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all text-sm outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={message.id}
                                className={`p-4 rounded-xl border transition-colors ${getRoleColor(message.role)}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(message.role)}
                                        <span className="font-semibold text-sm capitalize">
                                            {message.role}
                                        </span>
                                        <span className="text-xs opacity-60">
                                            Message {index + 1}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteMessage(message.id)}
                                        disabled={messages.length === 1}
                                        className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <textarea
                                    value={message.content}
                                    onChange={(e) => updateMessage(message.id, e.target.value)}
                                    placeholder={`Enter ${message.role} message... Use {{variable}} for placeholders`}
                                    className="w-full p-3 border border-slate-300/80 dark:border-slate-700/80 rounded-lg focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none font-mono text-sm bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 outline-none"
                                    rows={4}
                                />

                                {showPreview && message.content && (
                                    <div className="mt-3 p-3 bg-white/70 dark:bg-slate-950/70 rounded-lg border border-slate-200/70 dark:border-slate-800/70">
                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Preview:</div>
                                        <div className="text-sm whitespace-pre-wrap text-slate-900 dark:text-slate-100 font-mono">
                                            {renderPreview(message.content)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Message Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-3">
                        <button
                            onClick={() => addMessage('system')}
                            className="flex-1 px-4 py-2.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <Settings className="w-4 h-4" />
                            Add System
                        </button>
                        <button
                            onClick={() => addMessage('user')}
                            className="flex-1 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <User className="w-4 h-4" />
                            Add User
                        </button>
                        <button
                            onClick={() => addMessage('assistant')}
                            className="flex-1 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <Bot className="w-4 h-4" />
                            Add Assistant
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="p-6 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-colors">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Export Template</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy JSON'}
                            </button>
                            <button
                                onClick={exportAsJSON}
                                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Download JSON
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                            <div className="flex gap-2 text-sm text-blue-800 dark:text-blue-300">
                                <FileJson className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Tip:</strong> Use variables like <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/70 rounded text-xs font-mono">{'{{name}}'}</code> in your messages. They&apos;ll be replaced with actual values when you use the template.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
