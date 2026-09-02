// HACK: Safari (testado até o 17) às vezes rejeita navigator.clipboard.writeText
// quando o clique que disparou a cópia veio de dentro de um elemento com
// position: absolute (nosso dropdown de citação), porque o navegador não
// reconhece como "gesto do usuário" direto o suficiente. O fallback com
// execCommand é feio mas resolve. Remover quando isso for corrigido lá —
// ver https://bugs.webkit.org/show_bug.cgi?id=222262 (ainda aberto).
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let succeeded = false;
  try {
    succeeded = document.execCommand("copy");
  } catch {
    succeeded = false;
  }
  document.body.removeChild(textarea);
  return succeeded;
}
