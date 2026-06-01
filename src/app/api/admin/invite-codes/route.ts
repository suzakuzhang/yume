import { NextResponse } from "next/server";
import {
  createInviteCode,
  deleteInviteCode,
  listInviteCodes,
  toggleInviteCode,
  updateInviteCode,
} from "@/lib/store";
import { isAdminRequest } from "@/lib/access/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  return NextResponse.json({ items: listInviteCodes() });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "无权限" }, { status: 403 });
  let body: {
    action?: string;
    code?: string;
    type?: "whitelist" | "quota";
    maxUses?: number;
    label?: string;
    isActive?: boolean;
    resetUsed?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "create":
        return NextResponse.json(
          createInviteCode({
            createdBy: "admin",
            type: body.type ?? "quota",
            maxUses: body.maxUses,
            code: body.code,
            label: body.label,
          })
        );
      case "update": {
        const r = updateInviteCode(body.code ?? "", {
          maxUses: body.maxUses,
          label: body.label,
          type: body.type,
          resetUsed: body.resetUsed,
        });
        return r ? NextResponse.json(r) : NextResponse.json({ error: "未找到" }, { status: 404 });
      }
      case "toggle": {
        const r = toggleInviteCode(body.code ?? "", !!body.isActive);
        return r ? NextResponse.json(r) : NextResponse.json({ error: "未找到" }, { status: 404 });
      }
      case "delete":
        return NextResponse.json({ ok: deleteInviteCode(body.code ?? "") });
      default:
        return NextResponse.json({ error: "未知 action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
