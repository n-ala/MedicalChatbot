const http = require('http');
const url = require('url');

// Sample data for clinic specializations, doctors, available dates, time slots, and appointments
const specializations = [
    { id: 1, name: "Cardiology" },
    { id: 2, name: "Dermatology" },
    { id: 3, name: "Neurology" },
    { id: 4, name: "Pediatrics" }
];

const doctors = [
    { id: 1, name: "Dr. Smith", specializationId: 1, availableDates: [{date:'2025-02-10'}, {date:'2025-02-11'}] },
    { id: 2, name: "Dr. Jones", specializationId: 2, availableDates: [{date:'2025-02-12'}, {date:'2025-02-13'}] }
];

const timeSlots = [
    { doctorId: 1, date: '2025-02-10', slots: [{slot:'9:00 AM'}, {slot:'10:00 AM'}, {slot:'11:00 AM'}] },
    { doctorId: 1, date: '2025-02-11', slots: [{slot:'2:00 PM'}, {slot:'3:00 PM'}, {slot:'4:00 PM'}] },
    { doctorId: 2, date: '2025-02-12', slots: [{slot:'10:00 AM'}, {slot:'11:00 AM'}] },
    { doctorId: 2, date: '2025-02-13', slots: [{slot:'1:00 PM'}, {slot:'2:00 PM'}] }
];

const appointments = [];

// Create an HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
    const method = req.method;

    // Set response headers
    res.setHeader('Content-Type', 'application/json');

    // Handle GET /api/specializations
    if (pathname === '/api/specializations' && method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify(specializations));
    }
    // Handle GET /api/doctors
    else if (pathname === '/api/doctors' && method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify(doctors));
    }
    // Handle GET /api/doctors/specialization/:id
 else if (pathname.startsWith('/api/doctors/specialization/') && method === 'GET') {
     console.log("Pathname: ",pathname)
    const id = parseInt(pathname.split('/')[4]);
    const filteredDoctors = doctors.filter(doctor => doctor.specializationId === id);

    res.statusCode = 200;
    res.end(JSON.stringify(filteredDoctors));
}

    // Handle GET /api/doctors/:id/available-dates
    else if (pathname.startsWith('/api/doctors/') && pathname.endsWith('/available-dates') && method === 'GET') {
        console.log("Pathname: ",pathname)
        const doctorId = parseInt(pathname.split('/')[3]);
        const doctor = doctors.find(d => d.id === doctorId);

        if (doctor) {
            res.statusCode = 200;
            res.end(JSON.stringify(doctor.availableDates));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Doctor not found" }));
        }
    }
    // Handle GET /api/doctors/:id/available-times/:date
    else if (pathname.startsWith('/api/doctors/') && pathname.includes('/available-times/') && method === 'GET') {
        console.log("Pathname: ",pathname)
        const doctorId = parseInt(pathname.split('/')[3]);
        const date = pathname.split('/')[5];
        const availableSlots = timeSlots.find(ts => ts.doctorId === doctorId && ts.date === date);

        if (availableSlots) {
            res.statusCode = 200;
            res.end(JSON.stringify(availableSlots.slots));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "No available slots found" }));
        }
    }
    // Handle POST /api/appointments to book an appointment
else if (pathname === '/api/appointments' && method === 'POST') {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { patientId, specializationId, doctorId, date, time } = JSON.parse(body);

        if (!patientId || !doctorId || !date || !time) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: "Missing required fields" }));
        }

        const newAppointment = {
            id: appointments.length + 1,
            patientId,
            doctorId,
            date,
            time
        };

        appointments.push(newAppointment);

        res.statusCode = 200;
        res.end(JSON.stringify({ message: "Appointment booked successfully", appointmentId: newAppointment.id }));
    });
}

    else if (pathname.startsWith('/api/appointments/patient/') && method === 'GET') {
    const patientId = parseInt(pathname.split('/')[4]);
    console.log("Pathname: ",pathname)
    console.log("Appointments: ", JSON.stringify(appointments))
    const patientAppointments = appointments
        .filter(app => parseInt(app.patientId) === parseInt(patientId))
        .map(app => {
            // Retrieve doctor name
            const doctor = doctors.find(doc => parseInt(doc.id) === parseInt(app.doctorId));
            const doctorName = doctor ? doctor.name : "Unknown Doctor";

            // Retrieve specialization name
            const specialization = specializations.find(spec => parseInt(spec.id) === parseInt(doctor?.specializationId));
            const specializationName = specialization ? specialization.name : "Unknown Specialization";

            // Return modified appointment with names instead of IDs
            return {
                ...app,
                doctorName,
                specializationName
            };
        });
    res.statusCode = 200;
    res.end(JSON.stringify(patientAppointments));
}



else if (pathname.startsWith('/api/appointments/cancel') && method === 'POST') {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { id, patientId } = JSON.parse(body);

        // Find appointment by ID and patient ID
        const index = appointments.findIndex(app => 
            parseInt(app.id) === parseInt(id) && 
            parseInt(app.patientId) === parseInt(patientId)
        );

        if (index !== -1) {
            appointments.splice(index, 1);
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "Appointment cancelled successfully" }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Appointment not found or unauthorized" }));
        }
    });
}


else if (pathname.startsWith('/api/appointments/reschedule') && method === 'POST') {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { id, patientId, date, time } = JSON.parse(body);
        const appointment = appointments.find(app => parseInt(app.id) === parseInt(id) && parseInt(app.patientId) === parseInt(patientId));

        if (appointment) {
            appointment.date = date;
            appointment.time = time;
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "Appointment rescheduled successfully" }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Appointment not found or unauthorized" }));
        }
    });
}




    // Handle unknown routes
    else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Route not found" }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
