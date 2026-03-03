import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
  { code: "pt", flag: "🇧🇷" },
  { code: "es", flag: "🇪🇸" },
] as const;

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { i18n, t } = useTranslation();

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[hsl(200,40%,60%)] hover:bg-[hsla(200,80%,50%,0.1)] hover:text-white"
        >
          <Globe className="mr-2 h-4 w-4" />
          {!collapsed && (
            <span>{current.flag} {t(`language.${current.code}`)}</span>
          )}
          {collapsed && <span>{current.flag}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border-[hsla(200,80%,60%,0.25)] bg-[hsl(215,85%,12%)]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className="cursor-pointer text-white hover:bg-[hsla(200,80%,50%,0.15)]"
          >
            {lang.flag} {t(`language.${lang.code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
