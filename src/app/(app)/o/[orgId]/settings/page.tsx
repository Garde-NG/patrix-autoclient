"use client";

import { useState, type FormEvent } from "react";
import { Copy, MailPlus, ScrollText, Trash2, UserMinus, Users } from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import { LinkInstallation } from "@/components/repositories/connect-sheet";
import { useOrgContext } from "@/components/shell/org-provider";
import { useUser } from "@/components/shell/user-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge, MockBadge, RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, KeyValue, ListGroup, Row } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, SearchField } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Menu } from "@/components/ui/menu";
import { PageHeader } from "@/components/ui/page";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { ListSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { ListShell } from "@/components/shared/list-shell";
import { ApiError } from "@/lib/api/client";
import { useAudit } from "@/lib/api/hooks/audit";
import { useInstallations, useUnlinkInstallation } from "@/lib/api/hooks/github";
import { useCreateInvite, useInvites, useMembers, useRemoveMember, useRevokeInvite, useUpdateMemberRole, useUpdateOrg } from "@/lib/api/hooks/orgs";
import { useListParams } from "@/lib/hooks/use-list-params";
import type { OrgRole } from "@/lib/api/types";
import { formatDateTime, humanize, timeAgo } from "@/lib/utils";

type Tab = "general" | "members" | "github" | "audit";
const DEFAULTS = { tab: "general" as Tab };

export default function SettingsPage() {
  const { isAdmin } = useOrgContext();
  const { params, update } = useListParams(DEFAULTS);
  const tab = params.tab;
  return (
    <>
      <PageHeader title="Settings" description="Workspace name, people, GitHub access and the audit trail." />
      <Segmented
        ariaLabel="Settings section"
        value={tab}
        onChange={(t) => update({ tab: t })}
        className="mb-5"
        options={[
          { value: "general", label: "General" },
          { value: "members", label: "Members" },
          { value: "github", label: "GitHub" },
          ...(isAdmin ? [{ value: "audit" as Tab, label: "Audit trail" }] : []),
        ]}
      />
      {tab === "general" ? <General /> : tab === "members" ? <Members /> : tab === "github" ? <GitHubTab /> : <Audit />}
    </>
  );
}

function General() {
  const { org, orgId, isAdmin } = useOrgContext();
  const update = useUpdateOrg(orgId);
  const [name, setName] = useState(org.name);
  const fields = update.error instanceof ApiError ? update.error.fields : {};
  const submit = (e: FormEvent) => {
    e.preventDefault();
    update.mutate({ name: name.trim() }, { onSuccess: () => toast.success("Workspace renamed") });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Workspace" description={isAdmin ? "The name appears in navigation and notifications." : "Only admins can change these."} />
        <CardBody>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} error={fields.name} maxLength={120} required />
            <Input label="Slug" value={org.slug} readOnly disabled hint="Used in URLs. Fixed after creation." />
            {isAdmin ? (
              <div className="flex justify-end">
                <Button type="submit" loading={update.isPending} disabled={name.trim() === org.name || !name.trim()}>
                  Save
                </Button>
              </div>
            ) : null}
          </form>
        </CardBody>
      </Card>
      <ListGroup>
        <dl className="divide-y divide-separator">
          <KeyValue label="Plan" value={humanize(org.plan_code)} />
          <KeyValue label="Your role" value={<RoleBadge role={org.role} />} />
          <KeyValue label="Created" value={formatDateTime(org.created_at)} />
          <KeyValue label="Id" value={org.id} mono />
        </dl>
      </ListGroup>
    </div>
  );
}

function Members() {
  const { orgId, isAdmin, isOwner } = useOrgContext();
  const me = useUser();
  const members = useMembers(orgId);
  const invites = useInvites(orgId, isAdmin);
  const updateRole = useUpdateMemberRole(orgId);
  const remove = useRemoveMember(orgId);
  const revoke = useRevokeInvite(orgId);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="t-headline text-text">People</h2>
          <p className="t-footnote text-text-2">Owners manage roles and billing. Admins manage sources, repositories and repairs. Members can view and acknowledge.</p>
        </div>
        {isAdmin ? (
          <Button leading={<MailPlus className="size-4" />} onClick={() => setInviting(true)}>
            Invite
          </Button>
        ) : null}
      </div>
      {members.isPending ? (
        <ListSkeleton rows={3} />
      ) : (
        <ListGroup>
          {members.data?.map((m) => {
            const isMe = m.user_id === me.id;
            const canEdit = isOwner && !isMe;
            const canRemove = isAdmin && !isMe && (isOwner || m.role !== "owner");
            return (
              <Row
                key={m.id}
                leading={<Avatar name={m.name} seed={m.user_id} />}
                trailing={
                  <div className="flex items-center gap-2">
                    {canEdit ? (
                      <Select
                        size="sm"
                        aria-label={`Role for ${m.name}`}
                        wrapperClassName="w-32"
                        value={m.role}
                        onChange={(role) => updateRole.mutate({ memberId: m.id, role: role as OrgRole }, { onSuccess: () => toast.success("Role updated") })}
                        options={[
                          { value: "owner", label: "Owner" },
                          { value: "admin", label: "Admin" },
                          { value: "member", label: "Member" },
                        ]}
                      />
                    ) : (
                      <RoleBadge role={m.role} />
                    )}
                    {canRemove ? (
                      <Menu items={[{ label: "Remove from workspace", icon: <UserMinus />, danger: true, onSelect: () => setRemoving({ id: m.id, name: m.name }) }]} trigger={<Button variant="ghost" size="icon" aria-label="Member actions"><Users className="size-4" /></Button>} />
                    ) : null}
                  </div>
                }
              >
                <p className="t-body truncate font-medium text-text">
                  {m.name} {isMe ? <span className="t-caption text-text-3">(you)</span> : null}
                </p>
                <p className="t-footnote truncate text-text-2">{m.email}</p>
              </Row>
            );
          })}
        </ListGroup>
      )}

      {isAdmin ? (
        <>
          <div className="px-1">
            <h2 className="t-headline text-text">Pending invitations</h2>
            <p className="t-footnote text-text-2">Each invitation is a one-time link. Share it with the invitee directly.</p>
          </div>
          {invites.isPending ? (
            <ListSkeleton rows={2} />
          ) : !invites.data?.length ? (
            <EmptyState compact title="No pending invitations" />
          ) : (
            <ListGroup>
              {invites.data.map((inv) => (
                <Row
                  key={inv.id}
                  trailing={
                    <div className="flex items-center gap-2">
                      <RoleBadge role={inv.role} />
                      <Button variant="ghost" size="icon" aria-label="Revoke invitation" onClick={() => revoke.mutate(inv.id, { onSuccess: () => toast.success("Invitation revoked") })}>
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  }
                >
                  <p className="t-body truncate font-medium text-text">{inv.email}</p>
                  <p className="t-footnote text-text-2">
                    Expires {timeAgo(inv.expires_at)} · sent {formatDateTime(inv.created_at)}
                  </p>
                </Row>
              ))}
            </ListGroup>
          )}
        </>
      ) : null}

      <InviteSheet orgId={orgId} open={inviting} onClose={() => setInviting(false)} canInviteAdmins={isOwner} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name}?`}
        description="They lose access immediately. You can invite them again later."
        confirmLabel="Remove"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id, { onSuccess: () => { toast.success("Member removed"); setRemoving(null); } })}
      />
    </div>
  );
}

function InviteSheet({ orgId, open, onClose, canInviteAdmins }: { orgId: string; open: boolean; onClose: () => void; canInviteAdmins: boolean }) {
  const create = useCreateInvite(orgId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [token, setToken] = useState<string | null>(null);
  const fields = create.error instanceof ApiError ? create.error.fields : {};
  const link = token && typeof window !== "undefined" ? `${window.location.origin}/invites/accept?token=${encodeURIComponent(token)}` : "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate({ email: email.trim().toLowerCase(), role }, { onSuccess: (inv) => setToken(inv.token) });
  };
  const close = () => {
    setToken(null);
    setEmail("");
    setRole("member");
    onClose();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy", "Select the link and copy it manually.");
    }
  };

  return (
    <Sheet open={open} onClose={close} title={token ? "Invitation ready" : "Invite someone"} description={token ? "This link is shown once. Send it to the invitee; they sign in or sign up, then join automatically." : "They'll receive a one-time link you share with them."}>
      {token ? (
        <div className="flex flex-col gap-4 pb-2">
          <div className="rounded-[14px] bg-surface-2 p-4">
            <p className="t-caption mb-1 font-semibold uppercase tracking-wide text-text-3">Invitation link</p>
            <p className="t-mono break-all text-[12px] text-text">{link}</p>
          </div>
          <Button size="lg" leading={<Copy className="size-4" />} onClick={copy}>
            Copy link
          </Button>
          <Button variant="secondary" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
          {create.error && !Object.keys(fields).length ? <p role="alert" className="t-footnote rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-danger">{create.error.message}</p> : null}
          <Input label="Email" type="email" inputMode="email" autoCapitalize="none" required value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} autoFocus />
          <Select
            label="Role"
            value={role}
            onChange={(r) => setRole(r as OrgRole)}
            error={fields.role}
            options={[
              { value: "member", label: "Member", description: "View findings and acknowledge them" },
              { value: "admin", label: "Admin", description: "Manage sources, repositories and repairs" },
              ...(canInviteAdmins ? [{ value: "owner", label: "Owner", description: "Everything, including billing" }] : []),
            ]}
          />
          <Button type="submit" size="lg" loading={create.isPending} disabled={!email.trim()}>
            Create invitation
          </Button>
        </form>
      )}
    </Sheet>
  );
}

function GitHubTab() {
  const { orgId, isAdmin } = useOrgContext();
  const installations = useInstallations(orgId);
  const unlink = useUnlinkInstallation(orgId);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="px-1">
          <h2 className="t-headline text-text">Linked installations</h2>
          <p className="t-footnote text-text-2">Least privilege: contents and metadata read, plus pull-request write only where repairs are delivered.</p>
        </div>
        {installations.isPending ? (
          <ListSkeleton rows={2} />
        ) : !installations.data?.length ? (
          <EmptyState compact icon={Github} title="No GitHub installation linked" description="Link one to connect repositories." />
        ) : (
          <ListGroup>
            {installations.data.map((i) => (
              <Row
                key={i.id}
                leading={
                  <span className="flex size-10 items-center justify-center rounded-[12px] bg-fill text-text">
                    <Github className="size-5" />
                  </span>
                }
                trailing={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={i.status} />
                    {isAdmin ? (
                      <Button variant="ghost" size="icon" aria-label="Unlink installation" onClick={() => setUnlinking(i.id)}>
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    ) : null}
                  </div>
                }
              >
                <p className="t-body flex items-center gap-2 font-medium text-text">
                  {i.account_login} <MockBadge show={i.is_mock} />
                </p>
                <p className="t-footnote text-text-2">
                  {humanize(i.account_type)} · installation {i.installation_id} · linked {formatDateTime(i.created_at)}
                </p>
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(i.permissions ?? {}).map(([k, v]) => (
                    <Badge key={k} tone={v === "write" ? "accent" : "neutral"}>
                      {k}: {v}
                    </Badge>
                  ))}
                </p>
              </Row>
            ))}
          </ListGroup>
        )}
      </div>
      {isAdmin ? (
        <Card>
          <CardHeader title="Link another installation" />
          <CardBody>
            <LinkInstallation orgId={orgId} compact />
          </CardBody>
        </Card>
      ) : null}
      <ConfirmDialog
        open={!!unlinking}
        onClose={() => setUnlinking(null)}
        title="Unlink this installation?"
        description="Repositories connected through it stop being scanned."
        confirmLabel="Unlink"
        variant="danger"
        loading={unlink.isPending}
        onConfirm={() => unlinking && unlink.mutate(unlinking, { onSuccess: () => { toast.success("Installation unlinked"); setUnlinking(null); } })}
      />
    </div>
  );
}

function Audit() {
  const { orgId, isAdmin } = useOrgContext();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const query = useAudit(orgId, { page, page_size: 25, action: action || undefined }, isAdmin);
  return (
    <div className="space-y-3">
      <SearchField size="sm" aria-label="Action" wrapperClassName="max-w-sm" className="font-mono" value={action} onChange={(v) => { setAction(v); setPage(1); }} placeholder="Filter by action, e.g. source.create" />
      <ListShell query={query} onPage={setPage} empty={<EmptyState icon={ScrollText} title="No audit events" />}>
        {(items) => (
          <ListGroup>
            {items.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <span className={`mt-2 size-2 shrink-0 rounded-full ${e.success ? "bg-success" : "bg-danger"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="t-mono text-[13px] font-semibold text-text">{e.action}</p>
                  <p className="t-footnote text-text-2">
                    {e.actor_email ?? "system"}
                    {e.target_type ? ` · ${e.target_type}${e.target_id ? ` ${e.target_id.slice(0, 8)}` : ""}` : ""}
                    {e.ip_address ? ` · ${e.ip_address}` : ""}
                  </p>
                </div>
                <span className="t-caption shrink-0 text-text-3">{formatDateTime(e.created_at)}</span>
              </div>
            ))}
          </ListGroup>
        )}
      </ListShell>
    </div>
  );
}
