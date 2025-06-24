Agente Telefónico IA para Agendamiento Automático de Citas
¿Qué es este proyecto?
Este proyecto es un sistema de software totalmente automatizado que funciona como un agente telefónico inteligente. Su principal función es realizar y recibir llamadas para agendar, confirmar y reprogramar citas de servicio (como visitas de técnicos, inspecciones, mantenimientos, etc.) sin necesidad de intervención humana.

Utiliza el poder de la Inteligencia Artificial, específicamente el procesamiento del lenguaje natural, para entender las respuestas de los clientes en una conversación fluida y tomar decisiones en tiempo real.

Mejorando Vidas: Empresas eficientes, Clientes felices
Este sistema no es solo una pieza de código; es una solución diseñada para optimizar radicalmente la forma en que las empresas gestionan sus citas, impactando positivamente tanto a la organización como a sus clientes.

Para las Empresas:
Reducción drástica de costos: Elimina la necesidad de tener agentes humanos dedicados a la tediosa tarea de llamar para agendar citas. Los únicos costos son el uso de la API y la plataforma de telefonía, que son significativamente menores que un salario.

Operatividad 24/7: El agente IA puede trabajar sin descanso, agendando citas a cualquier hora del día, cualquier día de la semana.

Eficiencia y Escalabilidad: Puede manejar cientos o miles de llamadas simultáneamente sin perder calidad, algo imposible para un equipo humano.

Disminución de Ausencias (No-Shows): Al confirmar activamente las citas, se reduce la tasa de clientes que olvidan o no asisten a su cita, optimizando el tiempo de los técnicos.

Profesionalismo y Consistencia: Cada llamada se realiza siguiendo el mismo guion de alta calidad, asegurando una comunicación consistente y profesional.

Para las Personas (Clientes):
Atención Inmediata: No más esperas en línea. El cliente recibe una llamada directa, clara y concisa.

Comodidad y Flexibilidad: Pueden confirmar o solicitar un cambio de fecha en la misma llamada, en cuestión de segundos.

Comunicación Natural: Gracias a la IA, la conversación se siente fluida, no como un robot anticuado que solo entiende "sí" o "no".

Aspectos Técnicos de Interés
Este sistema está construido sobre una arquitectura moderna, flexible y de bajo costo, lo que facilita su implementación y adaptación.

Tecnologías Clave:
Plataforma de Telefonía (CPaaS): El código está diseñado para ejecutarse en un entorno de comunicaciones en la nube (como Voximplant, Twilio, etc.). Estas plataformas proveen la infraestructura para realizar llamadas y ejecutar lógica de backend.

Inteligencia Artificial: Se utiliza la API de OpenAI (GPT-4o) para el Procesamiento del Lenguaje Natural (NLU). Esto permite interpretar las intenciones del usuario (aceptar, cancelar, proponer nueva fecha, hacer una pregunta).

Base de Datos Flexible (vía API): Para una máxima simplicidad y bajo costo, el ejemplo usa Google Sheets como base de datos, accedida a través de un servicio como SheetDB. Este enfoque es increíblemente fácil de gestionar, pero el sistema puede adaptarse para conectarse a cualquier base de datos con una API REST (MySQL, PostgreSQL, MongoDB, Firebase, etc.).

¿Cómo funciona el flujo?
Inicio: Un evento (ej. una nueva fila en una hoja de cálculo o una llamada a una API) dispara el proceso con los datos del cliente.

Búsqueda Inteligente: El script consulta la base de datos de técnicos para encontrar el primer hueco disponible que cumpla con las reglas de negocio (horarios, servicios, días no laborales).

Llamada Saliente: Realiza la llamada al cliente.

Propuesta: Usando Text-to-Speech (TTS), el agente IA saluda al cliente y le propone la fecha y hora encontradas.

Escucha y Comprensión: A través de Automatic Speech Recognition (ASR), captura la respuesta del cliente. Esta respuesta se envía a la API de OpenAI.

Interpretación: OpenAI devuelve un JSON estructurado con la intención del cliente ("acepta_cita": true, "quiere_nueva_fecha": true, etc.).

Acción:

Si el cliente acepta, la cita se registra en la base de datos y la llamada termina amablemente.

Si el cliente propone otra fecha, el sistema vuelve a buscar disponibilidad según la nueva petición.

Si el cliente cancela, se registra la cancelación y finaliza la llamada.

Gestión de Llamadas Entrantes: El sistema también puede gestionar llamadas de clientes que devuelven la llamada, informándoles sobre su cita o proporcionando un mensaje estándar.

Facilidad de Implementación
Recrear o implementar esta solución es un proceso sencillo:

Configurar las Herramientas:

Obtener una cuenta en una plataforma CPaaS (ej. Voximplant).

Obtener una clave de API de OpenAI.

Crear dos hojas de cálculo en Google Sheets: una para los Técnicos (con sus horarios y servicios) y otra para las Citas Agendadas.

Conectar la Base de Datos: Usar un servicio como SheetDB para generar URLs de API para ambas hojas de cálculo.

Personalizar el Script: Rellenar las variables de configuración en el archivo de código (OPENAI_API_KEY, las URLs de la base de datos, etc.).

Desplegar: Subir el script a la plataforma de telefonía y asociarlo a un número de teléfono.

¡Y listo! El sistema está preparado para empezar a trabajar.

¿Interesado en implementar una solución como esta o en explorar otras innovaciones tecnológicas?
Puedes contactarme y ver más de mi trabajo en mi portafolio:

https://federicogzc.github.io/
