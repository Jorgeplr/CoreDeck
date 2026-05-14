import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import clsx from "clsx";

marked.setOptions({ gfm: true, breaks: true });

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className }: Props) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "del", "code", "pre", "blockquote",
        "a", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
        "hr", "img", "table", "thead", "tbody", "tr", "th", "td",
      ],
      ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt"],
      ADD_ATTR: ["target"],
    });
  }, [content]);

  return (
    <div
      className={clsx(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-pre:bg-[var(--app-panel-2)] prose-pre:text-[var(--app-text)]",
        "prose-code:before:content-none prose-code:after:content-none",
        "prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:bg-[var(--app-panel-2)]",
        "prose-a:text-[var(--app-accent)] prose-a:no-underline hover:prose-a:underline",
        className
      )}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
