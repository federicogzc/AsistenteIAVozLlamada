# 🤖📞 Agente Telefónico IA para Agendamiento Automático de Citas

---

## ¿Qué es este proyecto?

Este sistema es un **agente telefónico inteligente totalmente automatizado** que **realiza y recibe llamadas** para **agendar, confirmar y reprogramar citas de servicio** —sin intervención humana.

Gracias al uso de **Inteligencia Artificial (IA)** y **Procesamiento de Lenguaje Natural (NLP)**, es capaz de mantener conversaciones fluidas con los clientes y tomar decisiones en tiempo real.

---

## 💡 Mejorando Vidas: Empresas eficientes, Clientes felices

### ✅ Para las Empresas

- 💰 **Reducción de costos**: sin agentes humanos, solo pagas por el uso de API y llamadas.
- 🕐 **Operatividad 24/7**: disponible cualquier día, a cualquier hora.
- ⚙️ **Escalabilidad**: maneja cientos o miles de llamadas simultáneas.
- 📉 **Menos ausencias**: confirma citas activamente, reduciendo no-shows.
- 📞 **Profesionalismo constante**: cada llamada sigue un guion de alta calidad.

### 🙋‍♂️ Para los Clientes

- ⚡ **Atención inmediata**: sin esperas, llamada directa y clara.
- 🔄 **Comodidad**: pueden aceptar o cambiar la cita en segundos.
- 🧠 **Conversación natural**: se siente como hablar con una persona.

---

## 🧰 Aspectos Técnicos de Interés

### 🛠️ Tecnologías Clave

- **📡 Plataforma CPaaS**: como [Voximplant](https://voximplant.com) o [Twilio](https://twilio.com).
- **🧠 IA GPT-4o**: vía API de OpenAI para interpretar intenciones.
- **📊 Base de datos ligera**: Google Sheets + [SheetDB](https://sheetdb.io) para acceso vía REST API.

---

## 🔁 ¿Cómo funciona el flujo?

1. **🎯 Disparo del proceso**  
   Evento externo (nueva fila en hoja o llamada API).

2. **🔎 Búsqueda inteligente**  
   Consulta la disponibilidad de técnicos con reglas de negocio.

3. **📞 Llamada saliente**  
   El agente IA llama al cliente y propone la mejor cita disponible.

4. **🗣️ Escucha e interpretación**  
   Usa TTS + ASR + OpenAI para entender la respuesta del cliente.

5. **🧠 Decisión basada en intención**  
   OpenAI responde con algo como:
   ```json
   {
     "acepta_cita": true,
     "quiere_nueva_fecha": false
   }
📝 Acción

Si acepta → se agenda la cita y se despide.

Si propone otra fecha → el sistema busca otra opción.

Si cancela → se registra y se finaliza.

📥 Llamadas entrantes
También responde llamadas, con información sobre citas o un mensaje estándar.
