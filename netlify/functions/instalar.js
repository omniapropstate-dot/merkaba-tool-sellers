import { getStore } from "@netlify/blobs";
import { readFile } from "node:fs/promises";

export default async (request) => {
  const url = new URL(request.url);
  const clave = url.searchParams.get("clave") || "";

  const claveMaestraReal = process.env.CLAVE_MAESTRA;
  if (!claveMaestraReal) {
    return new Response("Falta configurar la CLAVE_MAESTRA en Netlify", { status: 200 });
  }
  if (clave !== claveMaestraReal) {
    return new Response("Clave maestra incorrecta. Usa: /.netlify/functions/instalar?clave=TU_CLAVE", { status: 401 });
  }

  try {
    const html = await readFile(new URL("../../herramienta.html", import.meta.url), "utf-8");
    const tienda = getStore("herramienta");
    await tienda.set("contenido", html);
    return new Response("Herramienta instalada correctamente. Tus clientes ya pueden entrar.", { status: 200 });
  } catch (e) {
    return new Response("Error al instalar: " + e.message, { status: 500 });
  }
};

export const config = {
  includedFiles: ["herramienta.html"],
};
