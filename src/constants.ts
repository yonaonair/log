import type { Props } from "astro";
import IconMail from "@/assets/icons/IconMail.svg";
import IconGitHub from "@/assets/icons/IconGitHub.svg";
import IconBrandX from "@/assets/icons/IconBrandX.svg";
import IconLinkedin from "@/assets/icons/IconLinkedin.svg";
import IconWhatsapp from "@/assets/icons/IconWhatsapp.svg";
import IconFacebook from "@/assets/icons/IconFacebook.svg";
import IconTelegram from "@/assets/icons/IconTelegram.svg";
import IconPinterest from "@/assets/icons/IconPinterest.svg";
import { SITE } from "@/config";
import socialsData from "@/data/config/socials.json";

interface Social {
  name: string;
  href: string;
  linkTitle: string;
  icon: (_props: Props) => Element;
}

const ICON_MAP: Record<string, (_props: Props) => Element> = {
  GitHub: IconGitHub,
  X: IconBrandX,
  LinkedIn: IconLinkedin,
  Mail: IconMail,
  WhatsApp: IconWhatsapp,
  Facebook: IconFacebook,
  Telegram: IconTelegram,
  Pinterest: IconPinterest,
};

const TITLE_MAP: Record<string, string> = {
  GitHub: `${SITE.title} on GitHub`,
  X: `${SITE.title} on X`,
  LinkedIn: `${SITE.title} on LinkedIn`,
  Mail: `Send an email to ${SITE.title}`,
  WhatsApp: `Share via WhatsApp`,
  Facebook: `${SITE.title} on Facebook`,
  Telegram: `${SITE.title} on Telegram`,
  Pinterest: `${SITE.title} on Pinterest`,
};

export const SOCIALS: Social[] = socialsData
  .filter(s => s.active)
  .map(s => ({
    name: s.name,
    href: s.href,
    linkTitle: TITLE_MAP[s.name] ?? s.name,
    icon: ICON_MAP[s.name],
  }));

export const SHARE_LINKS: Social[] = [
  {
    name: "WhatsApp",
    href: "https://wa.me/?text=",
    linkTitle: `Share this post via WhatsApp`,
    icon: IconWhatsapp,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/sharer.php?u=",
    linkTitle: `Share this post on Facebook`,
    icon: IconFacebook,
  },
  {
    name: "X",
    href: "https://x.com/intent/post?url=",
    linkTitle: `Share this post on X`,
    icon: IconBrandX,
  },
  {
    name: "Telegram",
    href: "https://t.me/share/url?url=",
    linkTitle: `Share this post via Telegram`,
    icon: IconTelegram,
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/pin/create/button/?url=",
    linkTitle: `Share this post on Pinterest`,
    icon: IconPinterest,
  },
  {
    name: "Mail",
    href: "mailto:?subject=See%20this%20post&body=",
    linkTitle: `Share this post via email`,
    icon: IconMail,
  },
] as const;
