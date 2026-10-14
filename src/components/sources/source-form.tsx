"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import { useCreateSource, useUpdateSource } from "@/lib/api/hooks/sources";
import type { Source, SourceCredential } from "@/lib/api/types";

const INTERVALS = [
  { value: 900, label: "Every 15 minutes" },
  { value: 3600, label: "Every hour" },
  { value: 6 * 3600, label: "Every 6 hours" },
  { value: 24 * 3600, label: "Daily" },
  { value: 7 * 24 * 3600, label: "Weekly" },
];

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function SourceSheet({ orgId, open, onClose, source, onSaved }: { orgId: string; open: boolean; onClose: () => void; source?: Source; onSaved?: (s: Source) => void }) {
  const editing = !!source;
  const create = useCreateSource(orgId);
  const update = useUpdateSource(orgId, source?.id ?? "");
  const mutation = editing ? update : create;
  const fields = mutation.error instanceof ApiError ? mutation.error.fields : {};

  const [name, setName] = useState(source?.name ?? "");
  const [providerKey, setProviderKey] = useState(source?.provider_key ?? "");
  const [keyTouched, setKeyTouched] = useState(editing);
  const [url, setUrl] = useState(source?.url ?? "");
  const [interval, setInterval] = useState(source?.poll_interval_seconds ?? 3600);
  const [authType, setAuthType] = useState<"" | SourceCredential["auth_type"]>("");
  const [secret, setSecret] = useState("");
  const [headerName, setHeaderName] = useState("");
  const [clearCredential, setClearCredential] = useState(false);

  const credential: SourceCredential | null = authType && secret ? { auth_type: authType, secret, ...(authType === "header" ? { header_name: headerName } : {}) } : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (editing) {
      update.mutate(
        { name: name.trim(), url: url.trim() || null, poll_interval_seconds: interval, ...(credential ? { credential } : {}), clear_credential: clearCredential },
        {
          onSuccess: (s) => {
            toast.success("Source updated");
            onSaved?.(s);
            onClose();
          },
        },
      );
    } else {
      create.mutate(
        { name: name.trim(), provider_key: providerKey, url: url.trim() || null, poll_interval_seconds: interval, ...(credential ? { credential } : {}) },
        {
          onSuccess: (s) => {
            toast.success("Source added", s.url ? "Fetching the first snapshot now." : "Upload a document to capture the baseline.");
            onSaved?.(s);
            onClose();
          },
        },
      );
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit source" : "Add API source"}
      description={editing ? undefined : "Point at a provider's OpenAPI document. Leave the URL empty to upload documents yourself."}
      footer={
        <Button type="submit" form="source-form" size="lg" className="w-full" loading={mutation.isPending} disabled={!name.trim() || (!editing && !providerKey)}>
          {editing ? "Save changes" : "Add source"}
        </Button>
      }
    >
      <form id="source-form" onSubmit={submit} className="flex flex-col gap-4 pb-2">
        {mutation.error && !Object.keys(fields).length ? (
          <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">
            {mutation.error.message}
          </p>
        ) : null}
        <Input
          label="Name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!keyTouched) setProviderKey(slugify(e.target.value));
          }}
          error={fields.name}
          placeholder="Stripe API"
          autoFocus
        />
        {!editing ? (
          <Input
            label="Provider key"
            required
            value={providerKey}
            onChange={(e) => {
              setKeyTouched(true);
              setProviderKey(slugify(e.target.value));
            }}
            error={fields.provider_key}
            hint="Lowercase identifier that links this source to detected SDKs, e.g. stripe."
            pattern="^[a-z0-9][a-z0-9_-]*$"
          />
        ) : null}
        <Input label="OpenAPI URL" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} error={fields.url} placeholder="https://api.example.com/openapi.json" hint="Fetched now, then on the schedule below. Private and loopback addresses are refused." />
        <Select label="Poll interval" value={interval} onChange={(e) => setInterval(Number(e.target.value))} error={fields.poll_interval_seconds}>
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </Select>

        <fieldset className="rounded-[14px] border border-separator p-4">
          <legend className="t-footnote px-1 font-medium text-text-2">Authentication {source?.has_credential ? "(a credential is stored)" : "(optional)"}</legend>
          <div className="flex flex-col gap-3">
            <Select label="Type" value={authType} onChange={(e) => setAuthType(e.target.value as typeof authType)}>
              <option value="">{source?.has_credential ? "Keep existing credential" : "None"}</option>
              <option value="bearer">Bearer token</option>
              <option value="basic">Basic (user:password)</option>
              <option value="header">Custom header</option>
            </Select>
            {authType === "header" ? <Input label="Header name" value={headerName} onChange={(e) => setHeaderName(e.target.value)} placeholder="X-API-Key" required /> : null}
            {authType ? <Input label="Secret" type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} required hint="Encrypted at rest. Never shown again." /> : null}
            {editing && source?.has_credential && !authType ? (
              <label className="flex items-center gap-2.5 text-[14px] text-text">
                <input type="checkbox" checked={clearCredential} onChange={(e) => setClearCredential(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                Remove the stored credential
              </label>
            ) : null}
          </div>
        </fieldset>
      </form>
    </Sheet>
  );
}
