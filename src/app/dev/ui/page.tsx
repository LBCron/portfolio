'use client';

import { ArrowRight, ArrowUpRight, Link2, Terminal } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { Tooltip } from '@/components/ui/tooltip';
import { toast } from '@/stores/toast-store';

function Demo({ title, children }: { children: ReactNode; title: string }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="mb-6 font-label text-text-3">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

export default function DevUiPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container-page py-16">
      <h1 className="mb-10 text-h2">UI components</h1>

      <Demo title="Button">
        <Button>
          See my work
          <ArrowRight
            aria-hidden="true"
            className="transition-transform group-hover/button:translate-x-0.5"
          />
        </Button>
        <Button variant="secondary">Get in touch</Button>
        <Button variant="ghost">
          <Terminal aria-hidden="true" />
          Open the terminal
        </Button>
        <ButtonAnchor href="https://example.com" variant="secondary">
          Visit app
          <ArrowUpRight aria-hidden="true" />
        </ButtonAnchor>
        <Button variant="secondary" size="icon" aria-label="Copy link">
          <Link2 aria-hidden="true" />
        </Button>
        <Button disabled>Disabled</Button>
      </Demo>

      <Demo title="Chip, Badge, Kbd, Icon">
        <Chip>TypeScript</Chip>
        <Chip>+3</Chip>
        <Badge>Web</Badge>
        <Badge tone="accent">Featured</Badge>
        <Badge tone="success">Live</Badge>
        <Badge tone="warn">In progress</Badge>
        <span className="flex items-center gap-1 text-small">
          <Kbd>Ctrl</Kbd>
          <Kbd>/</Kbd>
        </span>
        <Icon icon={Terminal} label="Terminal" className="size-5 text-text-1" />
      </Demo>

      <Demo title="Tooltip and Toast">
        <Tooltip content="Ctrl + / toggles the terminal">
          <Button variant="secondary" size="icon" aria-label="Open the terminal">
            <Terminal aria-hidden="true" />
          </Button>
        </Tooltip>
        <Button variant="secondary" onClick={() => toast('Copied', 'success')}>
          Show toast
        </Button>
      </Demo>

      <Demo title="Dialog">
        <Button variant="secondary" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Your session expires soon"
          closeLabel="Close"
        >
          <p className="mb-6">Native modal dialog with focus restoration.</p>
          <Button onClick={() => setDialogOpen(false)}>Stay signed in</Button>
        </Dialog>
      </Demo>

      <section className="border-t border-line py-10">
        <SectionHeader
          id="demo-section"
          index={1}
          eyebrow="About"
          title="Section header"
          lead="Mono eyebrow with a number, the section heading and an optional lead paragraph."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Reveal key={index} index={index}>
              <Card className="p-6">
                <h3 className="text-h3">Card {index + 1}</h3>
                <p className="mt-2 text-small">Spotlight border follows a fine pointer.</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
