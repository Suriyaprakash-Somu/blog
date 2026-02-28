import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function MarkdownContentServer({ source }: { source: string }) {
  return (
    <div className="prose prose-lg dark:prose-invert prose-primary mx-auto w-full max-w-none text-justify">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h1
              {...props}
              className="mt-12 mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance"
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              {...props}
              className="mt-10 mb-5 pb-2 text-2xl font-semibold tracking-tight sm:text-3xl border-b text-balance"
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              {...props}
              className="mt-8 mb-4 text-xl font-semibold tracking-tight sm:text-2xl text-balance"
            >
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4
              {...props}
              className="mt-6 mb-4 text-lg font-semibold tracking-tight sm:text-xl text-balance"
            >
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p
              {...props}
              className="leading-7 not-first:mt-6 text-foreground/90"
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul
              {...props}
              className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground/90"
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              {...props}
              className="my-6 ml-6 list-decimal [&>li]:mt-2 text-foreground/90"
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="leading-7">
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          a({ href, children, ...props }) {
            const url = typeof href === "string" ? href : "";
            const external = url ? isExternalHref(url) : false;
            return (
              <a
                href={url}
                {...props}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                {children}
              </a>
            );
          },
          code({ className, children, ...props }) {
            const isBlock =
              typeof className === "string" && className.includes("language-");
            if (!isBlock) {
              return (
                <code
                  {...props}
                  className="relative rounded bg-muted px-[0.4rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground"
                >
                  {children}
                </code>
              );
            }

            return (
              <code {...props} className={className}>
                {children}
              </code>
            );
          },
          pre({ children, ...props }) {
            return (
              <pre
                {...props}
                className="my-6 rounded-xl border bg-zinc-950 p-6 overflow-x-auto text-zinc-50 dark:bg-zinc-900/50"
              >
                {children}
              </pre>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                {...props}
                className="mt-6 border-l-4 border-primary/40 pl-6 italic text-muted-foreground/90 bg-muted/20 py-2 pr-4 rounded-r-lg"
              >
                {children}
              </blockquote>
            );
          },
          hr: ({ ...props }) => (
            <hr {...props} className="my-10 border-muted" />
          ),
          img: ({ src, alt, ...props }) => (
            <div className="my-10 w-full overflow-hidden rounded-2xl border shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                {...props}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              {alt ? (
                <p className="text-center text-sm text-muted-foreground mt-3 mb-2 px-4">
                  {alt}
                </p>
              ) : null}
            </div>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
