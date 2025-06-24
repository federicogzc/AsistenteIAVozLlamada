/**
 * @fileoverview Script anonimizado y modularizado para un sistema de agendamiento de citas telefónicas automatizado.
 * Este código está diseñado para ser utilizado como una plantilla o portafolio.
 * La información sensible ha sido reemplazada por placeholders.
 *
 * @author Tu Nombre/Tu Empresa
 * @version 1.1.0
 */

// -----------------------------------------------
// 📦 MÓDULOS Y DEPENDENCIAS DE LA PLATAFORMA
// -----------------------------------------------
// Estos 'require' son específicos de la plataforma de telefonía (ej. Voximplant).
// Asegúrate de que los módulos correspondan a los que tu proveedor ofrece.
require(Modules.CallList);
require(Modules.ASR); // Automatic Speech Recognition
require(Modules.AI);

// -----------------------------------------------
// 🔑 CONFIGURACIÓN Y VARIABLES DE ENTORNO
// -----------------------------------------------
// Es una buena práctica gestionar las claves y URLs sensibles a través de variables de entorno.
// Aquí se usan placeholders para que cualquiera pueda configurar el script.

/**
 * @const {string} OPENAI_API_KEY - Tu clave secreta para la API de OpenAI.
 * @description Reemplaza 'YOUR_OPENAI_API_KEY' con tu clave real.
 * @example 'sk-...'
 */
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

/**
 * @const {string} OPENAI_API_URL - Endpoint para las completiciones de chat de OpenAI.
 */
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * @const {string} TECHNICIANS_DB_URL - URL de tu base de datos de técnicos (ej. SheetDB, Airtable, API propia).
 * @description Debe apuntar a una lista de técnicos con sus horarios y servicios.
 * @example 'https://sheetdb.io/api/v1/xxxxxxxx'
 */
const TECHNICIANS_DB_URL = 'YOUR_TECHNICIANS_DATABASE_URL';

/**
 * @const {string} APPOINTMENTS_DB_URL - URL de tu base de datos de citas asignadas.
 * @description Usada para leer y escribir las citas agendadas.
 * @example 'https://sheetdb.io/api/v1/yyyyyyyy'
 */
const APPOINTMENTS_DB_URL = 'YOUR_APPOINTMENTS_DATABASE_URL';

/**
 * @const {string} YOUR_COMPANY_NAME - El nombre de tu empresa o la del cliente.
 * @description Se usará en los mensajes de voz para personalizar la comunicación.
 */
const YOUR_COMPANY_NAME = "[Nombre de la Empresa]";

/**
 * @const {string} YOUR_CONTACT_PHONE_NUMBER - Un número de teléfono de contacto para los clientes.
 */
const YOUR_CONTACT_PHONE_NUMBER = "[Número de Contacto]";


// -----------------------------------------------
// ⚙️ PARÁMETROS DE FUNCIONAMIENTO
// -----------------------------------------------

const storage = {
    callerId: 'YOUR_CALLER_ID', // Reemplaza con el número de teléfono que se mostrará al llamar
    isWaitingForDateConfirmation: false,
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    city: "",
    service: "",
    technicianAssigned: "No disponible",
    appointmentTime: "Por asignar",
    appointmentDate: "Por asignar",
    callId: null
};

const messages = [];
const aiVoice = VoiceList.Google.es_ES_Standard_E; // Voz de Google para Text-to-Speech
const appointmentStartDate = new Date();
const workingDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
let customBlockedDays = [];
let blockedDatesByTechnician = {};
const appointmentDurationHours = 1; // Duración de la cita en horas (0.5 para media hora)
const maxSearchDaysForTechnician = 150; // Máximo de días a futuro para buscar disponibilidad
const maxRetries = 3; // Intentos de ASR antes de colgar

let failedAttempts = 0;
let call, asr, player;
let canListen = false;

// -----------------------------------------------
// 📝 PLANTILLAS DE MENSAJES
// -----------------------------------------------

const INBOUND_CALL_MESSAGE = `Hola, estás llamando a ${YOUR_COMPANY_NAME}. Este número es exclusivo para agendar una visita de nuestros técnicos. Si recibiste una llamada nuestra y no lograste contestar, no te preocupes, te llamaremos más tarde. Para otros asuntos, contáctate al número ${YOUR_CONTACT_PHONE_NUMBER}. ¡Adiós!`;

/**
 * Objeto que mapea códigos de servicio a mensajes de saludo.
 * @description Personaliza los códigos (ej. 'GAS-INSPECTION', 'BOILER-MAINTENANCE') y los mensajes
 * según los servicios que ofrezcas. Esto permite que el bot dé un saludo específico
 * para cada tipo de llamada.
 */
const GREETINGS_BY_SERVICE_CODE = {
    "DEFAULT": `Le llamo de ${YOUR_COMPANY_NAME} para gestionar una cita de servicio.`,
    "SVC-001": `Le llamo de ${YOUR_COMPANY_NAME} para realizar la inspección de su instalación de gas. Esta revisión está incluida en su contrato, no tiene ningún coste asociado y le permitirá asegurar el buen funcionamiento de la misma.`,
    "SVC-002": `Le llamo de ${YOUR_COMPANY_NAME} para realizar la inspección periódica reglamentaria de su instalación de gas. Durante el año en curso, usted deberá pasar satisfactoriamente esta inspección obligatoria.`,
    "SVC-003": `Le llamo de ${YOUR_COMPANY_NAME} para realizar el mantenimiento de la caldera de su hogar. Este servicio está incluido en su contrato y es obligatorio realizarlo cada dos años.`
    // ... Agrega aquí todos los códigos de servicio y mensajes que necesites.
};


// ───────────────────────────────────────────────
// 🛠️ FUNCIONES UTILITARIAS
// ───────────────────────────────────────────────

function formatTime(h, m = 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToMinutes(timeStr) {
    const clean = timeStr.trim().replace('h', '');
    const parts = clean.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    return hours * 60 + minutes;
}

function createWaitManager({ delay = 3000, message = "Un momento por favor..." } = {}) {
    let timeoutId = null;
    let messagePlayed = false;

    return {
        start(callRef, onFinished) {
            timeoutId = setTimeout(() => {
                const notice = VoxEngine.createTTSPlayer(message, {
                    language: aiVoice,
                    progressivePlayback: true
                });
                notice.sendMediaTo(callRef);
                notice.addEventListener(PlayerEvents.PlaybackFinished, () => {
                    messagePlayed = true;
                    if (onFinished) onFinished();
                });
            }, delay);
        },
        stop() {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        },
        wasPlayed() {
            return messagePlayed;
        }
    };
}

function playAndHangup(text) {
    const tts = VoxEngine.createTTSPlayer(text, {
        language: aiVoice,
        progressivePlayback: true
    });
    tts.sendMediaTo(call);
    tts.addEventListener(PlayerEvents.PlaybackFinished, () => {
        Logger.write("🔚 Mensaje final reproducido. Terminando llamada.");
        VoxEngine.terminate();
    });
}

function playAndListen(text) {
    player = VoxEngine.createTTSPlayer(text, {
        language: aiVoice,
        progressivePlayback: true
    });

    player.sendMediaTo(call);
    canListen = false; // Desactiva escucha durante el mensaje

    player.addEventListener(PlayerEvents.PlaybackFinished, () => {
        Logger.write("🔊 Playback finalizado, activando ASR...");
        canListen = true; // Ahora sí puede escuchar
        call.sendMediaTo(asr);
    });
}

function formatHumanDate(isoDate) {
    try {
        const date = new Date(isoDate);
        // Ajustar la fecha a la zona horaria correcta para evitar desfases de un día
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return correctedDate.toLocaleDateString('es-ES', options);
    } catch {
        return isoDate; // Fallback
    }
}

// ───────────────────────────────────────────────
// 📅 GESTIÓN DE FECHAS Y HORARIOS
// ───────────────────────────────────────────────

function isTimeInWorkRange(time, range) {
    if (!range || !time) return false;
    const [h, m] = time.split(':').map(Number);
    const minutes = h * 60 + (m || 0);
    const [startText, endText] = range.split('-');
    const start = timeToMinutes(startText);
    const end = timeToMinutes(endText);
    return minutes >= start && minutes < end;
}

function isBlockAvailable(startTime, durationMinutes, technicianSchedule, occupiedSlots) {
    if (!isTimeInWorkRange(startTime, technicianSchedule)) return false;

    const [h, m] = startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;

    for (let i = 0; i < durationMinutes; i += 5) { // Revisa en intervalos de 5 min
        const currentMin = startMinutes + i;
        const currentTime = formatTime(Math.floor(currentMin / 60), currentMin % 60);
        if (occupiedSlots.includes(currentTime)) return false;
    }

    const endBlock = startMinutes + durationMinutes;
    const [, endRangeText] = technicianSchedule.split('-');
    const endRange = timeToMinutes(endRangeText);

    return endBlock <= endRange;
}


function generateAvailableSlots(range, durationMinutes, occupiedSlots) {
    if (!range) return [];
    const [startText, endText] = range.split('-');
    const start = timeToMinutes(startText);
    const end = timeToMinutes(endText);
    const availableSlots = [];

    for (let min = start; min + durationMinutes <= end; min += durationMinutes) {
        const time = formatTime(Math.floor(min / 60), min % 60);
        let blockIsFree = true;
        for (let i = 0; i < durationMinutes; i += 5) {
            const subMin = min + i;
            const subTime = formatTime(Math.floor(subMin / 60), subMin % 60);
            if (occupiedSlots.includes(subTime)) {
                blockIsFree = false;
                break;
            }
        }
        if (blockIsFree) {
            availableSlots.push(time);
        }
    }
    return availableSlots;
}

function interpretTextAsDate(textDate) {
    // Esta función es compleja y depende mucho del idioma y formato.
    // La implementación original es un buen punto de partida.
    Logger.write(`Texto de fecha recibido para interpretar: ${textDate}`);
    const now = new Date();
    // Es crucial trabajar en la zona horaria correcta para evitar errores de un día
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
    let day = today.getDate();
    let month = today.getMonth(); // 0-based
    let year = today.getFullYear();
    let hours = null;
    let minutes = 0;

    // Lógica para interpretar "lunes", "martes", etc.
    const weekDays = { "lunes": 1, "martes": 2, "miércoles": 3, "jueves": 4, "viernes": 5 };
    for (const dayText in weekDays) {
        if (new RegExp(dayText, "i").test(textDate)) {
            const todayDay = today.getDay(); // 0 = domingo, 1 = lunes..
            const targetDay = weekDays[dayText];
            const dayDifference = (targetDay - (todayDay === 0 ? 7 : todayDay) + 7) % 7 || 7;
            today.setDate(today.getDate() + dayDifference);
            day = today.getDate();
            month = today.getMonth();
            year = today.getFullYear();
            break;
        }
    }

    // Lógica para interpretar "17 de junio"
    const months = { "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5, "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11 };
    let matchDate = textDate.match(/(\d{1,2})\s*(de)?\s*([a-zA-Z]+)/i);
    if (matchDate && months[matchDate[3].toLowerCase()] !== undefined) {
        day = parseInt(matchDate[1], 10);
        month = months[matchDate[3].toLowerCase()];
    }

    // Lógica para la hora "a las 4 de la tarde"
    const matchTime = textDate.match(/(\d{1,2})(?::(\d{2}))?\s*(?:de\s+la\s+(mañana|tarde))?/i);
    if (matchTime) {
        hours = parseInt(matchTime[1], 10);
        minutes = matchTime[2] ? parseInt(matchTime[2], 10) : 0;
        const period = matchTime[3] ? matchTime[3].toLowerCase() : null;
        if (period === "tarde" && hours < 12) hours += 12;
        if (!period && hours >= 1 && hours <= 6) hours += 12; // Asumir tarde
    }

    const interpretedDate = new Date(Date.UTC(year, month, day, hours === null ? 0 : hours, minutes));
    Logger.write(`Fecha interpretada (UTC): ${interpretedDate.toISOString()}`);
    return interpretedDate;
}

function isValidAndWorkDay(date) {
    if (!(date instanceof Date) || isNaN(date)) return false;

    // No agendar para hoy o días pasados. Empezar desde mañana.
    const zone = "Europe/Madrid";
    const todayMadrid = new Date(new Date().toLocaleString("en-US", { timeZone: zone }));
    todayMadrid.setHours(0, 0, 0, 0);
    const tomorrowMadrid = new Date(todayMadrid);
    tomorrowMadrid.setDate(tomorrowMadrid.getDate() + 1);
    if (date < tomorrowMadrid) return false;

    const isoDate = date.toISOString().split('T')[0];
    if (customBlockedDays.includes(isoDate)) return false;

    const dayOfWeek = date.toLocaleDateString("es-ES", { weekday: "long", timeZone: 'UTC' }).toLowerCase();
    return workingDays.includes(dayOfWeek);
}

// ───────────────────────────────────────────────
// 🌐 INTERACCIÓN CON APIS EXTERNAS (DATABASE, AI)
// ───────────────────────────────────────────────

async function httpRequestWithRetries(url, options = {}, maxRetries = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await Net.httpRequestAsync(url, options);
            // Considerar 200 y 201 como éxito para POST
            if (response.code >= 200 && response.code < 300) return response;
            Logger.write(`⚠️ Intento ${attempt} fallido. Código: ${response.code}`);
        } catch (e) {
            Logger.write(`⚠️ Error en intento ${attempt}: ${e}`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error(`❌ Fallaron todos los intentos de HTTP hacia: ${url}`);
}

async function loadBlockedDates() {
    try {
        const res = await httpRequestWithRetries(TECHNICIANS_DB_URL, { method: 'GET' });
        const data = JSON.parse(res.text);
        customBlockedDays = data.map(f => f.fecha_bloqueada).filter(Boolean); // Asegúrate que el nombre de la columna sea correcto

        blockedDatesByTechnician = {};
        data.forEach(row => {
            const name = (row.nombre_tecnicos || '').trim();
            const dates = (row.fechaX_Tecnico || '').split(',').map(f => f.trim()).filter(f => f.length === 10);
            if (name && dates.length > 0) blockedDatesByTechnician[name] = dates;
        });

        Logger.write(`📅 Fechas bloqueadas cargadas: ${JSON.stringify(customBlockedDays)}`);
        Logger.write(`📅 Fechas bloqueadas por técnico: ${JSON.stringify(blockedDatesByTechnician)}`);
    } catch (e) {
        Logger.write(`❌ Error cargando fechas bloqueadas: ${e}`);
    }
}

async function getAssignedAppointments(date, technicianName) {
    const query = `search?fecha_cita=${encodeURIComponent(date)}&tecnico_asignado=${encodeURIComponent(technicianName)}`;
    try {
        const response = await httpRequestWithRetries(`${APPOINTMENTS_DB_URL}/${query}`, { method: 'GET' });
        const data = JSON.parse(response.text);
        return data.map(row => row.hora_cita).filter(Boolean).map(h => formatTime(...h.split(':').map(Number)));
    } catch (error) {
        Logger.write(`❌ Error obteniendo citas asignadas: ${error}`);
        return [];
    }
}

async function registerAppointmentInDB() {
    const formattedDate = new Date(storage.appointmentDate).toISOString().split('T')[0];
    const data = {
        first_name: storage.firstName,
        last_name: storage.lastName,
        phone_number: storage.phoneNumber,
        direccion: storage.address,
        ciudad: storage.city,
        servicio: storage.service,
        tecnico_asignado: storage.technicianAssigned,
        hora_cita: storage.appointmentTime,
        fecha_cita: formattedDate,
        call_id: storage.callId,
        estado: "Agendada",
        notas: storage.lastClientResponse || "Confirmación directa",
    };
    await httpRequestWithRetries(APPOINTMENTS_DB_URL, {
        method: 'POST',
        headers: ['Content-Type: application/json'],
        postData: JSON.stringify({ data })
    });
    Logger.write(`✅ Asignación registrada: ${data.tecnico_asignado} el ${data.fecha_cita} a las ${data.hora_cita}`);
}

async function deleteAppointmentFromDB() {
    if (!storage.callId) return;
    const query = `search?call_id=${encodeURIComponent(storage.callId)}`;
    const res = await httpRequestWithRetries(`${APPOINTMENTS_DB_URL}/${query}`, { method: 'GET' });
    const records = JSON.parse(res.text);
    for (const row of records) {
        if (row.id) {
            await httpRequestWithRetries(`${APPOINTMENTS_DB_URL}/id/${row.id}`, { method: 'DELETE' });
            Logger.write(`🗑️ Asignación eliminada (Call ID: ${storage.callId})`);
        }
    }
}

async function interpretClientResponse(userText) {
    const prompt = [
        {
            role: "system",
            content: `Eres un asistente telefónico para agendar citas en español. Analiza si el cliente acepta explícitamente la cita, propone otra fecha, quiere cancelar o consultar opciones. Responde SOLO con JSON. Formato esperado: { "acepta_cita": boolean, "quiere_nueva_fecha": boolean, "cancelar_todo": boolean, "nueva_fecha": "texto de la nueva fecha", "hora": "HH:MM", "consultar_opciones": boolean }`
        },
        { role: "user", content: userText }
    ];

    try {
        const response = await httpRequestWithRetries(OPENAI_API_URL, {
            headers: ["Content-Type: application/json", `Authorization: Bearer ${OPENAI_API_KEY}`],
            method: 'POST',
            postData: JSON.stringify({
                model: "gpt-4o",
                messages: prompt,
                max_tokens: 150,
                temperature: 0.1,
                response_format: { "type": "json_object" }
            })
        });

        const content = JSON.parse(response.text).choices[0].message.content;
        Logger.write(`🧾 Contenido OpenAI recibido: ${content}`);
        const parsed = JSON.parse(content);

        // Normalizar la fecha si el cliente propone una nueva
        if (parsed.quiere_nueva_fecha && parsed.nueva_fecha) {
            parsed.fecha_normalizada = interpretTextAsDate(parsed.nueva_fecha);
        }
        storage.lastInterpretation = parsed;
        return parsed;

    } catch (error) {
        Logger.write(`❌ Fallo al contactar o interpretar respuesta de OpenAI: ${error}`);
        return null;
    }
}

// ───────────────────────────────────────────────
// 🧠 LÓGICA DE AGENDAMIENTO Y ASIGNACIÓN
// ───────────────────────────────────────────────

async function findAvailableSlot(technician, dateISO, durationMin, preference) {
    const occupiedSlots = await getAssignedAppointments(dateISO, technician.nombre_tecnicos);

    // Si hay preferencia de hora, se intenta primero
    if (preference && preference.hora) {
        const schedule = parseInt(preference.hora.split(':')[0]) < 14 ? technician.horario_manana : technician.horario_tarde;
        if (isBlockAvailable(preference.hora, durationMin, schedule, occupiedSlots)) {
            return preference.hora;
        }
    }

    // Si no, buscar el primer hueco disponible
    const morningSlots = generateAvailableSlots(technician.horario_manana, durationMin, occupiedSlots);
    if (morningSlots.length > 0) return morningSlots[0];

    const afternoonSlots = generateAvailableSlots(technician.horario_tarde, durationMin, occupiedSlots);
    if (afternoonSlots.length > 0) return afternoonSlots[0];

    return null; // No hay huecos para este técnico en esta fecha
}

async function assignTechnician(serviceCode, preference = null) {
    const durationMin = appointmentDurationHours * 60;
    try {
        const res = await httpRequestWithRetries(TECHNICIANS_DB_URL, { method: 'GET' });
        const allTechnicians = JSON.parse(res.text);
        const compatibleTechnicians = allTechnicians.filter(t => t[serviceCode] && t[serviceCode].toUpperCase() === 'SI');

        if (compatibleTechnicians.length === 0) {
            Logger.write(`⚠️ No hay técnicos compatibles para el servicio: ${serviceCode}`);
            return false;
        }

        let searchDate = new Date();
        // Si hay preferencia de fecha, empezar por esa
        if (preference && preference.fecha) {
            searchDate = new Date(preference.fecha);
        }

        for (let i = 0; i < maxSearchDaysForTechnician; i++) {
            const currentDate = new Date(searchDate);
            currentDate.setDate(currentDate.getDate() + i);
            const currentDateISO = currentDate.toISOString().split('T')[0];

            if (!isValidAndWorkDay(currentDate)) continue;

            for (const tech of compatibleTechnicians) {
                const techBlockedDates = blockedDatesByTechnician[tech.nombre_tecnicos] || [];
                if (techBlockedDates.includes(currentDateISO)) {
                    Logger.write(`🚫 Fecha ${currentDateISO} bloqueada para técnico: ${tech.nombre_tecnicos}`);
                    continue;
                }

                const availableTime = await findAvailableSlot(tech, currentDateISO, durationMin, preference && preference.fecha === currentDateISO ? preference : null);

                if (availableTime) {
                    storage.technicianAssigned = tech.nombre_tecnicos;
                    storage.appointmentTime = availableTime;
                    storage.appointmentDate = currentDateISO;
                    Logger.write(`✅ Técnico asignado: ${storage.technicianAssigned} el ${storage.appointmentDate} a las ${storage.appointmentTime}`);
                    return true;
                }
            }
        }

        Logger.write("❌ No se encontró disponibilidad en el rango de búsqueda.");
        return false;

    } catch (err) {
        Logger.write(`❌ Error crítico en asignación de técnico: ${err}`);
        return false;
    }
}


// ───────────────────────────────────────────────
// 🔄 FLUJO PRINCIPAL DE LA LLAMADA
// ───────────────────────────────────────────────

VoxEngine.addEventListener(AppEvents.Started, async (e) => {
    const customData = VoxEngine.customData();
    if (customData && customData.trim()) {
        await mainOutboundCallFlow(customData);
    } else {
        Logger.write("▶️ No hay customData. Escuchando para llamadas entrantes.");
    }
});

VoxEngine.addEventListener(AppEvents.CallAlerting, (e) => {
    const incomingCall = e.call;
    Logger.write(`📞 Llamada entrante de ${incomingCall.callerid()}`);
    incomingCall.answer();
    incomingCall.addEventListener(CallEvents.Connected, () => {
        incomingCall.say(INBOUND_CALL_MESSAGE, { language: aiVoice });
    });
    incomingCall.addEventListener(CallEvents.PlaybackFinished, () => incomingCall.hangup());
    incomingCall.addEventListener(CallEvents.Disconnected, () => VoxEngine.terminate());
    incomingCall.addEventListener(CallEvents.Failed, () => VoxEngine.terminate());
});

async function mainOutboundCallFlow(customData) {
    try {
        await loadBlockedDates();
        const clientInfo = JSON.parse(customData);
        Object.assign(storage, clientInfo);

        const success = await assignTechnician(storage.service);
        if (!success) {
            Logger.write("❌ No se pudo encontrar disponibilidad. La llamada no se realizará.");
            // Opcional: registrar este fallo para reintentar luego.
            VoxEngine.terminate();
            return;
        }

        call = VoxEngine.callPSTN(storage.phoneNumber, storage.callerId);
        addCallEventListeners();
        
    } catch (error) {
        Logger.write(`❌ Error crítico al iniciar el escenario: ${error}`);
        VoxEngine.terminate();
    }
}

function addCallEventListeners() {
    call.addEventListener(CallEvents.Connected, () => {
        storage.callId = call.id();
        const greeting = GREETINGS_BY_SERVICE_CODE[storage.service] || GREETINGS_BY_SERVICE_CODE["DEFAULT"];
        const welcomeMessage = `Hola, ${storage.firstName}. ${greeting} Hemos programado su cita para el ${formatHumanDate(storage.appointmentDate)} a las ${storage.appointmentTime}. ¿Le parece bien?`;
        
        messages.push({ role: "assistant", content: welcomeMessage });
        playAndListen(welcomeMessage);
    });

    call.addEventListener(CallEvents.Disconnected, e => {
        Logger.write(" कॉल डिस्कनेक्ट हो गई");
        VoxEngine.terminate();
    });
    call.addEventListener(CallEvents.Failed, e => {
        Logger.write(`कॉल विफल: ${e.code}`);
        VoxEngine.terminate();
    });

    // Configuración del ASR
    asr = VoxEngine.createASR({ profile: ASRProfileList.Google.es_ES, singleUtterance: true });
    asr.addEventListener(ASREvents.Result, handleAsrResult);
}

async function handleAsrResult(e) {
    if (!canListen || !e.text || e.text.trim() === "") {
        if (!canListen) Logger.write("❌ ASR recibió audio pero no estaba escuchando.");
        return;
    }
    canListen = false; // Bloquear ASR hasta el próximo turno
    Logger.write(`🗣️ Cliente dijo: ${e.text}`);
    storage.lastClientResponse = e.text;

    const wait = createWaitManager();
    wait.start(call);

    const interpretation = await interpretClientResponse(e.text);
    wait.stop();

    await handleInterpretation(interpretation);
}

async function handleInterpretation(interpretation) {
    if (!interpretation) {
        failedAttempts++;
        if (failedAttempts >= maxRetries) {
            playAndHangup("Lo siento, no he podido entenderle. Un agente se pondrá en contacto con usted. Adiós.");
        } else {
            playAndListen("Disculpe, no le he entendido. ¿Puede repetir si está de acuerdo con la cita o si prefiere otra fecha?");
        }
        return;
    }

    failedAttempts = 0; // Resetear intentos si la IA entendió algo

    if (interpretation.acepta_cita) {
        const isStillAvailable = true; // Aquí podrías volver a verificar la disponibilidad como doble check
        if (isStillAvailable) {
            await registerAppointmentInDB();
            playAndHangup("Perfecto, su cita ha sido confirmada. Que tenga un buen día.");
        } else {
            playAndListen("Lo siento mucho, justo en este momento esa hora ha sido ocupada. ¿Desea que le busque la siguiente hora disponible?");
        }
    } else if (interpretation.quiere_nueva_fecha) {
        playAndListen("Entendido, ¿qué otra fecha y hora le vendría bien?");
        // El siguiente turno del ASR se encargará de capturar la nueva fecha propuesta.
        // La lógica para reagendar se activará con la nueva interpretación.
    } else if (interpretation.cancelar_todo) {
        await deleteAppointmentFromDB(); // Eliminar la cita pre-agendada si existe
        playAndHangup("De acuerdo, hemos cancelado el proceso de agendamiento. Si nos necesita, no dude en llamar. Adiós.");
    } else if (interpretation.nueva_fecha && interpretation.fecha_normalizada) {
        // El cliente ha propuesto una nueva fecha directamente
        const preference = {
            fecha: interpretation.fecha_normalizada.toISOString().split('T')[0],
            hora: interpretation.hora // Puede ser null
        };
        const success = await assignTechnician(storage.service, preference);
        if (success) {
            const confirmationMessage = `De acuerdo, he encontrado disponibilidad para el ${formatHumanDate(storage.appointmentDate)} a las ${storage.appointmentTime}. ¿Confirmamos esta nueva cita?`;
            playAndListen(confirmationMessage);
        } else {
            playAndListen("Lo siento, no he encontrado disponibilidad para la fecha que me indica. ¿Quiere probar con otra fecha?");
        }
    } else {
        // Caso ambiguo
        playAndListen("No estoy seguro de haberle entendido. ¿Puede confirmar si la fecha que le propuse está bien o si prefiere cambiarla?");
    }
}
