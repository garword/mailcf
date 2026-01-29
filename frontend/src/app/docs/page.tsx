"use client";

import { ArrowLeft, Book, Code, Terminal } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">

            {/* Header */}
            <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="container mx-auto max-w-4xl px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Book className="w-5 h-5 text-primary" />
                        <span>API Documentation</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link
                            href="/"
                            className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to App
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-4xl px-4 py-10 pb-20">

                <section className="mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">Worker API Reference</h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Automate your workflow with our simple JSON API. Integrate standard temporary email capabilities directly into your bots, scripts, or applications.
                    </p>
                    <div className="mt-6 p-4 bg-card border border-border rounded-xl flex items-center gap-3 text-sm text-muted-foreground">
                        <Terminal className="w-4 h-4 text-primary" />
                        <span>Base URL:</span>
                        <code className="bg-secondary px-2 py-1 rounded text-foreground font-mono select-all">
                            https://temp-email-worker.manulsinul99.workers.dev
                        </code>
                    </div>
                </section>

                <div className="space-y-12">

                    {/* Endpoint 1 */}
                    <EndpointSection
                        method="GET"
                        path="/api/domains"
                        title="List Domains"
                        description="Retrieve a list of all active domains available for creating email aliases."
                    >
                        <CodeBlock
                            title="Response Example"
                            code={`{
  "domains": [
    "example.com",
    "domainanda.my.id"
  ]
}`}
                        />
                    </EndpointSection>

                    {/* Endpoint 2 */}
                    <EndpointSection
                        method="POST"
                        path="/api/generate"
                        title="Generate Address"
                        description="Create a new temporary email address. You can optionally specify a custom prefix and domain."
                    >
                        <CodeBlock
                            title="Request Body (JSON)"
                            code={`{
  "prefix": "custom_name",  // Optional
  "domain": "example.com"   // Optional
}`}
                        />
                        <CodeBlock
                            title="Response"
                            code={`{
  "prefix": "custom_name",
  "domain": "example.com",
  "address": "custom_name@example.com"
}`}
                        />
                    </EndpointSection>

                    {/* Endpoint 3 */}
                    <EndpointSection
                        method="GET"
                        path="/api/inbox/:address"
                        title="Check Inbox"
                        description="Fetch emails for a specific address. Supports text search filtering which is ideal for OTP extraction."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ParamBadge name="address" type="URL Param" desc="Full email address" />
                            <ParamBadge name="limit" type="Query" desc="Max messages (default 20)" />
                            <ParamBadge name="search" type="Query" desc="Filter by subject/body" />
                        </div>

                        <CodeBlock
                            title="Example: Search for OTP"
                            code={`GET /api/inbox/user@domain.com?search=Facebook`}
                        />

                        <CodeBlock
                            title="Response"
                            code={`{
  "emails": [
    {
      "id": 12,
      "sender": "noreply@facebookmail.com",
      "subject": "123456 is your confirmation code",
      "body_text": "Here is your code: 123456 ...",
      "received_at": "2024-03-20T10:00:00Z"
    }
  ]
}`}
                        />
                    </EndpointSection>

                    {/* Endpoint 4 */}
                    <EndpointSection
                        method="GET"
                        path="/api/message/:id"
                        title="Get Message"
                        description="Retrieve the full content (HTML/Text) of a specific email message by its ID."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <ParamBadge name="id" type="URL Param" desc="Message ID (integer)" />
                        </div>
                        <CodeBlock
                            title="Response"
                            code={`{
  "id": 12,
  "address": "user@domain.com",
  "sender": "sender@external.com",
  "subject": "Hello World",
  "body_text": "Plain text content...",
  "body_html": "<div>HTML content...</div>",
  "received_at": "2024-03-20T10:00:00Z"
}`}
                        />
                    </EndpointSection>

                    {/* Endpoint 5 */}
                    <EndpointSection
                        method="GET"
                        path="/api/stats"
                        title="Global Stats"
                        description="Get the total count of generated temporary email addresses across the platform."
                    >
                        <CodeBlock
                            title="Response"
                            code={`{
  "total_emails": 15420
}`}
                        />
                    </EndpointSection>

                    {/* Python Example */}
                    <section className="pt-8 border-t border-border">
                        <div className="flex items-center gap-2 mb-6">
                            <Code className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-2xl font-bold">Python Automation Example</h2>
                        </div>
                        <CodeBlock
                            code={`import requests
import time

BASE_URL = "https://temp-email-worker.manulsinul99.workers.dev"

# 1. Generate Email
res = requests.post(f"{BASE_URL}/api/generate", json={})
address = res.json()['address']
print(f"Listening on: {address}")

# 2. Poll for specific OTP
print("Waiting for Facebook OTP...")
while True:
    res = requests.get(f"{BASE_URL}/api/inbox/{address}", params={"search": "Facebook"})
    emails = res.json()['emails']
    
    if emails:
        print(f"OTP Found: {emails[0]['body_text']}")
        break
    
    time.sleep(3)`}
                        />
                    </section>

                </div>
            </main>
        </div>
    );
}

function EndpointSection({ method, path, title, description, children }: any) {
    const methodColors: any = {
        GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        POST: "bg-green-500/10 text-green-500 border-green-500/20"
    };

    return (
        <section className="group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        {title}
                        <span className={`text-xs px-2 py-0.5 rounded border font-mono ${methodColors[method] || "bg-gray-500/10"}`}>
                            {method}
                        </span>
                    </h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-border bg-muted/30 font-mono text-sm flex items-center gap-2">
                    <span className="font-bold text-foreground">{method}</span>
                    <span className="text-muted-foreground">{path}</span>
                </div>
                <div className="p-6 space-y-6">
                    {children}
                </div>
            </div>
        </section>
    );
}

function CodeBlock({ title, code }: { title?: string, code: string }) {
    return (
        <div className="relative">
            {title && <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{title}</div>}
            <pre className="bg-secondary/50 border border-border rounded-lg p-4 overflow-x-auto custom-scrollbar">
                <code className="text-sm font-mono text-foreground">{code}</code>
            </pre>
        </div>
    );
}

function ParamBadge({ name, type, desc }: any) {
    return (
        <div className="flex items-center gap-2 text-sm p-2 rounded border border-border bg-background">
            <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">{name}</code>
            <span className="text-xs text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">{type}</span>
            <span className="text-muted-foreground ml-auto">{desc}</span>
        </div>
    );
}
