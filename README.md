# Agente Telefónico IA para Agendamiento Automático de Citas - Presentación estilo Canva

## Slide 1: Título

**Agente Telefónico con Inteligencia Artificial**  
**Para Agendamiento Automático de Citas**  
📞🤖 100% Automatizado • IA Conversacional • Eficiencia 24/7

---

## Slide 2: ¿Qué es este sistema?

Un **asistente telefónico autónomo** que llama, escucha, interpreta y registra citas de servicio sin intervención humana.

- 👉 Usa IA para entender lenguaje natural  
- 👉 Funciona 24/7 sin pausa  
- 👉 Escucha al cliente, toma decisiones y actualiza la base de datos

---

## Slide 3: ¿Qué puede hacer?

- ✅ Llamadas salientes automáticas para proponer citas  
- ✅ Reconocimiento de voz en español natural  
- ✅ Interpretación de frases como: “prefiero el jueves en la tarde”  
- ✅ Confirmación, reagendamiento o cancelación sin agentes humanos  
- ✅ Manejo de llamadas entrantes con respuestas claras

---

## Slide 4: Gestión inteligente de citas

- 🗓️ Verifica disponibilidad real de técnicos  
- 🔍 Evalúa horarios laborales, días bloqueados y compatibilidad de servicios  
- ⚙️ Encuentra el primer hueco disponible  
- ↻ Reagenda si el cliente propone nueva fecha/hora  
- 🗣️ Confirmación inmediata

---

## Slide 5: IA Conversacional con OpenAI

Utiliza **GPT-4o** para entender frases como:

- “el martes por la mañana”  
- “cámbiala al 15 de julio”  
- “quiero cancelarla”  
- “está bien a las 4, pero mejor en la tarde”

Devuelve un JSON estructurado con la intención del cliente:

```json
{
  "acepta_cita": true,
  "quiere_nueva_fecha": false,
  "cancelar_todo": false,
  "nueva_fecha": "",
  "hora": "",
  "consultar_opciones": false
}
```

---

## Slide 6: Tecnologías utilizadas

| Componente            | Tecnología           |
|----------------------|------------------------|
| Telefonía en la nube | Voximplant / Twilio    |
| Voz (TTS)             | Google Cloud TTS       |
| Reconocimiento de voz| Google ASR             |
| IA Conversacional    | OpenAI GPT-4o          |
| Base de datos        | Google Sheets + SheetDB|

---

## Slide 7: Ejemplo real de interacción

> 💬 Bot: *Hola, María. Le llamo para agendar la inspección. Tenemos disponible el miércoles 26 a las 10:00. ¿Le parece bien?*  
> 👤 Cliente: *¿Puede ser mejor el jueves en la tarde?*  
> 🧐 Bot: *He encontrado disponibilidad el jueves a las 16:00. ¿Confirmamos esta nueva cita?*

---

## Slide 8: Fácil de configurar e implementar

1. Crear hojas de cálculo (Técnicos + Citas)  
2. Conectarlas vía SheetDB  
3. Configurar claves (OpenAI, CallerID, etc.)  
4. Subir el script a tu proveedor CPaaS  
5. ✔️ Listo, empieza a agendar llamadas automáticas

---

## Slide 9: ¿Quieres usarlo en tu negocio?

Este sistema es ideal para:

- Empresas de servicios técnicos  
- Soporte a clientes  
- Agencias tecnológicas que integran IA y telefonía

🔗 [Visita mi portafolio para más soluciones](https://federicogzc.github.io)

---
