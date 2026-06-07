import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("No permitido", { status: 405 });
  }

  let clave;
  try {
    const datos = await request.json();
    clave = (datos.clave || "").trim();
  } catch {
    return json({ ok: false, motivo: "Petición inválida" }, 400);
  }

  if (!clave) {
    return json({ ok: false, motivo: "Escribe tu contraseña" }, 200);
  }

  const libreta = getStore("clientes");
  const registro = await libreta.get(clave, { type: "json" });

  if (!registro) {
    return json({ ok: false, motivo: "Contraseña incorrecta" }, 200);
  }

  if (registro.activo === false) {
    return json({ ok: false, motivo: "Este acceso fue desactivado" }, 200);
  }

  const tienda = getStore("herramienta");
  const html = await tienda.get("contenido");

  if (!html) {
    return json({ ok: false, motivo: "La herramienta no está configurada todavía" }, 200);
  }

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
