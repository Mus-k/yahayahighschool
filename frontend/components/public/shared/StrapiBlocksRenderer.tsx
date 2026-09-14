'use client';

import React, { useMemo } from 'react';
import { BlocksRenderer } from '@strapi/blocks-react-renderer';
import { marked } from 'marked';

interface Props {
  content: any[] | string | null | undefined;
  className?: string;
}

const RICHTEXT_STYLES = `
  .strapi-richtext {
    color: #5A636D;
    font-size: clamp(0.9375rem, 1vw, 1.0625rem);
    line-height: 1.85;
    word-break: break-word;
    display: block;
  }
  .strapi-richtext h1 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #121C2A !important;
    font-size: clamp(2rem, 3vw, 2.75rem) !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    margin-top: 2.5rem !important;
    margin-bottom: 1.25rem !important;
    display: block !important;
  }
  .strapi-richtext h2 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #121C2A !important;
    font-size: clamp(1.625rem, 2.3vw, 2.25rem) !important;
    font-weight: 700 !important;
    line-height: 1.3 !important;
    margin-top: 2rem !important;
    margin-bottom: 1rem !important;
    display: block !important;
  }
  .strapi-richtext > h1:first-child,
  .strapi-richtext > h2:first-child,
  .strapi-richtext > h3:first-child,
  .strapi-richtext > h4:first-child,
  .strapi-richtext > h5:first-child,
  .strapi-richtext > h6:first-child,
  .strapi-richtext > :is(h1, h2, h3, h4, h5, h6):first-child {
    margin-top: 0 !important;
  }
  .strapi-richtext h3 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #121C2A !important;
    font-size: clamp(1.35rem, 1.8vw, 1.75rem) !important;
    font-weight: 600 !important;
    line-height: 1.35 !important;
    margin-top: 1.85rem !important;
    margin-bottom: 0.75rem !important;
    display: block !important;
  }
  .strapi-richtext h4 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #121C2A !important;
    font-size: clamp(1.15rem, 1.4vw, 1.375rem) !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 1.5rem !important;
    margin-bottom: 0.5rem !important;
    display: block !important;
  }
  .strapi-richtext h5 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #121C2A !important;
    font-size: 1.125rem !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 1.25rem !important;
    margin-bottom: 0.5rem !important;
    display: block !important;
  }
  .strapi-richtext h6 {
    font-family: var(--font-heading), 'Playfair Display', Georgia, serif !important;
    color: #048ED6 !important;
    font-size: 0.95rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    margin-top: 1.25rem !important;
    margin-bottom: 0.5rem !important;
    display: block !important;
  }
  .strapi-richtext p {
    color: #5A636D !important;
    font-size: clamp(0.9375rem, 1vw, 1.0625rem) !important;
    margin-top: 0 !important;
    margin-bottom: 1.35rem !important;
    line-height: 1.85 !important;
    display: block !important;
  }
  .strapi-richtext strong,
  .strapi-richtext b {
    color: #121C2A !important;
    font-weight: 700 !important;
    display: inline !important;
  }
  .strapi-richtext em,
  .strapi-richtext i {
    font-style: italic !important;
    display: inline !important;
  }
  .strapi-richtext span {
    display: inline !important;
  }
  .strapi-richtext u {
    text-decoration: underline !important;
    text-underline-offset: 3px !important;
  }
  .strapi-richtext s,
  .strapi-richtext del {
    text-decoration: line-through !important;
  }
  .strapi-richtext ul {
    list-style-type: disc !important;
    margin-left: 1.75rem !important;
    margin-right: 0 !important;
    margin-bottom: 1.5rem !important;
    padding-left: 0.5rem !important;
    color: #5A636D !important;
    display: block !important;
  }
  [dir="rtl"] .strapi-richtext ul {
    margin-left: 0 !important;
    margin-right: 1.75rem !important;
    padding-left: 0 !important;
    padding-right: 0.5rem !important;
  }
  .strapi-richtext ol {
    list-style-type: decimal !important;
    margin-left: 1.75rem !important;
    margin-right: 0 !important;
    margin-bottom: 1.5rem !important;
    padding-left: 0.5rem !important;
    color: #5A636D !important;
    display: block !important;
  }
  [dir="rtl"] .strapi-richtext ol {
    margin-left: 0 !important;
    margin-right: 1.75rem !important;
    padding-left: 0 !important;
    padding-right: 0.5rem !important;
  }
  .strapi-richtext li {
    margin-bottom: 0.5rem !important;
    line-height: 1.75 !important;
    display: list-item !important;
  }
  .strapi-richtext blockquote {
    margin: 1.75rem 0 !important;
    border-left: 4px solid #048ED6 !important;
    border-right: none !important;
    background-color: #F2F9FD !important;
    padding: 1.25rem 1.5rem !important;
    border-radius: 0 0.75rem 0.75rem 0 !important;
    color: #121C2A !important;
    font-style: italic !important;
    display: block !important;
  }
  [dir="rtl"] .strapi-richtext blockquote {
    border-left: none !important;
    border-right: 4px solid #048ED6 !important;
    border-radius: 0.75rem 0 0 0.75rem !important;
  }
  .strapi-richtext a {
    color: #048ED6 !important;
    text-decoration: underline !important;
    text-underline-offset: 3px !important;
    font-weight: 500 !important;
    transition: color 0.2s ease !important;
  }
  .strapi-richtext a:hover {
    color: #037ab8 !important;
  }
  .strapi-richtext img {
    display: block !important;
    max-width: 100% !important;
    height: auto !important;
    border-radius: 1rem !important;
    margin: 2rem auto !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
  }
  .strapi-richtext hr {
    border: 0 !important;
    border-top: 1px solid #E5E7EB !important;
    margin: 2.5rem 0 !important;
    display: block !important;
  }
  .strapi-richtext pre {
    background-color: #121C2A !important;
    color: #F8FAFC !important;
    padding: 1.25rem 1.5rem !important;
    border-radius: 0.75rem !important;
    overflow-x: auto !important;
    margin: 1.75rem 0 !important;
    font-family: monospace !important;
    font-size: 0.875rem !important;
    line-height: 1.6 !important;
    display: block !important;
  }
  .strapi-richtext code {
    background-color: #F1F5F9 !important;
    color: #0B3B57 !important;
    padding: 0.2rem 0.45rem !important;
    border-radius: 0.35rem !important;
    font-family: monospace !important;
    font-size: 0.875em !important;
  }
  .strapi-richtext pre code {
    background-color: transparent !important;
    color: inherit !important;
    padding: 0 !important;
  }
  .strapi-richtext table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin: 2rem 0 !important;
    font-size: 0.95rem !important;
    display: table !important;
  }
  .strapi-richtext th {
    background-color: #F8FAFC !important;
    color: #121C2A !important;
    font-weight: 600 !important;
    text-align: left !important;
    padding: 0.75rem 1rem !important;
    border: 1px solid #E2E8F0 !important;
  }
  [dir="rtl"] .strapi-richtext th {
    text-align: right !important;
  }
  .strapi-richtext td {
    padding: 0.75rem 1rem !important;
    border: 1px solid #E2E8F0 !important;
    color: #5A636D !important;
  }
`;

/**
 * Renders Strapi richtext content supporting both:
 * 1. Strapi v5 Blocks JSON array (via BlocksRenderer)
 * 2. Markdown & HTML strings (via marked + custom typography styles)
 *
 * Supports h1-h6, p, span, strong, em, lists, quotes, tables, code, links, images.
 */
export function StrapiBlocksRenderer({ content, className }: Props) {
  const parsedHtml = useMemo(() => {
    if (typeof content !== 'string' || !content.trim()) return '';
    try {
      // 1. Normalize headings without space e.g. "##Title" -> "## Title"
      let preprocessed = content.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
      // 2. Normalize multiline bold e.g. "**text\n**" -> "<strong>text</strong>"
      preprocessed = preprocessed.replace(/\*\*([\s\S]+?)\s*\*\*/g, '<strong>$1</strong>');
      // 3. Normalize multiline italic e.g. "*text\n*" -> "<em>text</em>"
      preprocessed = preprocessed.replace(/(?<!\*)\*([^*\n]+?)\s*\*(?!\*)/g, '<em>$1</em>');

      return marked.parse(preprocessed, { gfm: true, breaks: true }) as string;
    } catch {
      return content;
    }
  }, [content]);

  if (!content) return null;

  // 1. Strapi v5 blocks: array of block objects
  if (Array.isArray(content) && content.length > 0) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: RICHTEXT_STYLES }} />
        <div className={`strapi-richtext ${className || ''}`}>
          <BlocksRenderer
            content={content}
            blocks={{
              paragraph: ({ children }) => (
                <p className="mb-4 leading-[1.8] text-[#5A636D]">{children}</p>
              ),
              heading: ({ children, level }) => {
                const sizes: Record<number, string> = {
                  1: 'text-3xl font-bold mt-8 mb-4',
                  2: 'text-2xl font-bold mt-6 mb-3',
                  3: 'text-xl font-semibold mt-5 mb-2',
                  4: 'text-lg font-semibold mt-4 mb-2',
                  5: 'text-base font-semibold mt-3 mb-1',
                  6: 'text-sm font-semibold mt-3 mb-1',
                };
                const cls = `font-serif text-[#121C2A] ${sizes[level] || ''}`;
                switch (level) {
                  case 1: return <h1 className={cls}>{children}</h1>;
                  case 2: return <h2 className={cls}>{children}</h2>;
                  case 3: return <h3 className={cls}>{children}</h3>;
                  case 4: return <h4 className={cls}>{children}</h4>;
                  case 5: return <h5 className={cls}>{children}</h5>;
                  case 6: return <h6 className={cls}>{children}</h6>;
                  default: return <h2 className={cls}>{children}</h2>;
                }
              },
              list: ({ children, format }) =>
                format === 'ordered' ? (
                  <ol className="mb-4 list-decimal pl-6 space-y-1 text-[#5A636D]">{children}</ol>
                ) : (
                  <ul className="mb-4 list-disc pl-6 space-y-1 text-[#5A636D]">{children}</ul>
                ),
              'list-item': ({ children }) => <li>{children}</li>,
              quote: ({ children }) => (
                <blockquote className="my-6 border-l-4 border-[#048ED6] pl-5 italic text-[#121C2A] bg-[#F2F9FD] p-4 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              code: ({ plainText }) => (
                <pre className="my-4 overflow-x-auto rounded-lg bg-[#121C2A] p-4 text-sm font-mono text-white">
                  <code>{plainText}</code>
                </pre>
              ),
              image: ({ image }) => (
                <figure className="my-6">
                  <img
                    src={image.url}
                    alt={image.alternativeText || ''}
                    className="w-full rounded-lg shadow-sm"
                  />
                  {image.caption && (
                    <figcaption className="mt-2 text-center text-xs text-[#9AA3AD]">
                      {image.caption}
                    </figcaption>
                  )}
                </figure>
              ),
              link: ({ children, url }) => (
                <a
                  href={url}
                  className="text-[#048ED6] underline font-medium hover:text-[#037ab8] transition-colors"
                  target={url.startsWith('http') ? '_blank' : undefined}
                  rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
            }}
            modifiers={{
              bold: ({ children }) => <strong className="font-bold text-[#121C2A]">{children}</strong>,
              italic: ({ children }) => <em className="italic">{children}</em>,
              underline: ({ children }) => <span className="underline">{children}</span>,
              strikethrough: ({ children }) => <s className="line-through">{children}</s>,
              code: ({ children }) => (
                <code className="rounded bg-[#F1F2F4] px-1.5 py-0.5 font-mono text-sm text-[#0B3B57]">
                  {children}
                </code>
              ),
            }}
          />
        </div>
      </>
    );
  }

  // 2. Markdown or HTML string (Strapi v5 richtext field)
  if (parsedHtml) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: RICHTEXT_STYLES }} />
        <div
          className={`strapi-richtext ${className || ''}`}
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      </>
    );
  }

  return null;
}
