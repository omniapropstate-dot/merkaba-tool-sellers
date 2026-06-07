import { getStore } from "@netlify/blobs";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("No permitido", { status: 405 });
  }

  let datos;
  try {
    datos = await request.json();
  } catch {
    return json({ ok: false, motivo: "Petición inválida" }, 400);
  }

  const claveMaestraReal = process.env.CLAVE_MAESTRA;
  if (!claveMaestraReal) {
    return json({ ok: false, motivo: "Falta configurar la CLAVE_MAESTRA en Netlify" }, 200);
  }
  if ((datos.claveMaestra || "") !== claveMaestraReal) {
    return json({ ok: false, motivo: "Clave maestra incorrecta" }, 401);
  }

  const libreta = getStore("clientes");
  const accion = datos.accion;

  if (accion === "crear") {
    const nombre = (datos.nombre || "").trim();
    const clave = (datos.clave || "").trim();
    if (!nombre || !clave) {
      return json({ ok: false, motivo: "Falta el nombre o la contraseña" }, 200);
    }
    const yaExiste = await libreta.get(clave, { type: "json" });
    if (yaExiste) {
      return json({ ok: false, motivo: "Esa contraseña ya está en uso, elige otra" }, 200);
    }
    await libreta.setJSON(clave, {
      nombre,
      telefono: (datos.telefono || "").trim(),
      gmail: (datos.gmail || "").trim(),
      area: (datos.area || "").trim(),
      activo: true,
      creado: new Date().toISOString(),
    });
    return json({ ok: true, mensaje: "Acceso creado para " + nombre });
  }

  if (accion === "editar") {
    const clave = (datos.clave || "").trim();
    const registro = await libreta.get(clave, { type: "json" });
    if (!registro) {
      return json({ ok: false, motivo: "No se encontró ese cliente" }, 200);
    }
    registro.nombre = (datos.nombre || registro.nombre || "").trim();
    registro.telefono = (datos.telefono || "").trim();
    registro.gmail = (datos.gmail || "").trim();
    registro.area = (datos.area || "").trim();
    await libreta.setJSON(clave, registro);
    return json({ ok: true, mensaje: "Datos actualizados" });
  }

  if (accion === "cambiarEstado") {
    const clave = (datos.clave || "").trim();
    const registro = await libreta.get(clave, { type: "json" });
    if (!registro) {
      return json({ ok: false, motivo: "No se encontró ese acceso" }, 200);
    }
    registro.activo = !registro.activo;
    await libreta.setJSON(clave, registro);
    return json({ ok: true, mensaje: registro.activo ? "Acceso reactivado" : "Acceso desactivado" });
  }

  if (accion === "borrar") {
    const clave = (datos.clave || "").trim();
    await libreta.delete(clave);
    return json({ ok: true, mensaje: "Acceso eliminado" });
  }

  if (accion === "listar") {
    const lista = [];
    const { blobs } = await libreta.list();
    for (const b of blobs) {
      const reg = await libreta.get(b.key, { type: "json" });
      if (reg) {
        lista.push({
          clave: b.key,
          nombre: reg.nombre || "",
          telefono: reg.telefono || "",
          gmail: reg.gmail || "",
          area: reg.area || "",
          activo: reg.activo,
          creado: reg.creado || "",
        });
      }
    }
    lista.sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
    return json({ ok: true, clientes: lista });
  }

  return json({ ok: false, motivo: "Acción desconocida" }, 200);
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}
