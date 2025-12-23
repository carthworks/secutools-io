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
            case 'system': return 'bg-purple-50 border-purple-200 text-purple-700';
            case 'user': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'assistant': return 'bg-green-50 border-green-200 text-green-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                            <Wand2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Prompt Template Builder
                        </h1>
                    </div>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Create reusable prompt templates with variables for consistent AI interactions
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Panel - Template Library */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur rounded-lg">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Library className="w-5 h-5 text-indigo-600" />
                                Template Library
                            </h2>

                            <div className="space-y-2">
                                {PRESET_TEMPLATES.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => loadPreset(preset)}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedPreset === preset.id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm text-slate-800">{preset.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{preset.description}</div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                                                {preset.category}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {preset.variables.length} variables
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={clearTemplate}
                                className="w-full mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Template
                            </button>
                        </div>

                        {/* Variables Panel */}
                        {variables.length > 0 && (
                            <div className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur rounded-lg">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Variables ({variables.length})
                                </h3>

                                <div className="space-y-3">
                                    {variables.map(variable => (
                                        <div key={variable}>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
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
                                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="w-full mt-4 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
                        <div className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur rounded-lg">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Template Name
                                    </label>
                                    <input
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="e.g., Code Review Assistant"
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={templateDescription}
                                        onChange={(e) => setTemplateDescription(e.target.value)}
                                        placeholder="Brief description of what this template does"
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={message.id}
                                    className={`p-4 rounded-lg border-2 ${getRoleColor(message.role)}`}
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
                                            className="p-1 hover:bg-white/50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <textarea
                                        value={message.content}
                                        onChange={(e) => updateMessage(message.id, e.target.value)}
                                        placeholder={`Enter ${message.role} message... Use {{variable}} for placeholders`}
                                        className="w-full p-3 border-2 border-white/50 rounded-lg focus:border-white focus:ring-2 focus:ring-white/30 transition-all resize-none font-mono text-sm bg-white/30"
                                        rows={4}
                                    />

                                    {showPreview && message.content && (
                                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                            <div className="text-xs font-semibold text-slate-600 mb-1">Preview:</div>
                                            <div className="text-sm whitespace-pre-wrap">
                                                {renderPreview(message.content)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Message Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => addMessage('system')}
                                className="flex-1 px-4 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Add System
                            </button>
                            <button
                                onClick={() => addMessage('user')}
                                className="flex-1 px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <User className="w-4 h-4" />
                                Add User
                            </button>
                            <button
                                onClick={() => addMessage('assistant')}
                                className="flex-1 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Bot className="w-4 h-4" />
                                Add Assistant
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur rounded-lg">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Export Template</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy JSON'}
                                </button>
                                <button
                                    onClick={exportAsJSON}
                                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download JSON
                                </button>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex gap-2 text-sm text-blue-800">
                                    <FileJson className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Tip:</strong> Use variables like <code className="px-1 py-0.5 bg-blue-100 rounded">{'{{name}}'}</code> in your messages. They'll be replaced with actual values when you use the template.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
