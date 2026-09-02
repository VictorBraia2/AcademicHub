// TODO: só cobre o caso "um vs. muitos" do português. Se um dia isso virar
// multi-idioma, trocar por Intl.PluralRules em vez de esticar essa função.
export function pluralizeCitations(count: number): string {
  return count === 1 ? "citação" : "citações";
}
