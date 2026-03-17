import { getFirebaseUser, getLegacyEnumerations, getLegacyInvoices } from "@/lib/firebase-admin"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Fetch Taxpayer from Firebase Auth
    const { user, error: userError } = await getFirebaseUser(id)
    if (userError || !user) {
      return NextResponse.json({ error: userError || "Taxpayer not found" }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        taxpayer: user,
      },
    })
  } catch (error: any) {
    console.error(`Error in legacy taxpayer details [${params.id}]:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
