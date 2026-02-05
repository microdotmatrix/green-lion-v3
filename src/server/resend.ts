import { RESEND_API_KEY } from "astro:env/server";
import { Resend } from "resend";

export const resend = new Resend(RESEND_API_KEY);
