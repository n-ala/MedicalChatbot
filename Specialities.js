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
    { id: 1, name: "Dr. Smith", specializationId: 1, availableDates: ['2025-02-10', '2025-02-11'] },
    { id: 2, name: "Dr. Jones", specializationId: 2, availableDates: ['2025-02-12', '2025-02-13'] }
];

const timeSlots = [
    { doctorId: 1, date: '2025-02-10', slots: ['9:00 AM', '10:00 AM', '11:00 AM'] },
    { doctorId: 1, date: '2025-02-11', slots: ['2:00 PM', '3:00 PM', '4:00 PM'] },
    { doctorId: 2, date: '2025-02-12', slots: ['10:00 AM', '11:00 AM'] },
    { doctorId: 2, date: '2025-02-13', slots: ['1:00 PM', '2:00 PM'] }
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
        const doctorId = parseInt(pathname.split('/')[2]);
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
        const doctorId = parseInt(pathname.split('/')[2]);
        const date = pathname.split('/')[4];
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

        // Collect the request body
        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const appointmentData = JSON.parse(body);

            // Check if the appointment data is valid
            const { doctorId, date, time, patientName } = appointmentData;

            const doctorExists = doctors.some(doctor => doctor.id === doctorId);
            const validDate = timeSlots.some(ts => ts.doctorId === doctorId && ts.date === date && ts.slots.includes(time));

            if (!doctorExists) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "Doctor not found" }));
            }

            if (!validDate) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "Invalid date or time slot" }));
            }

            // Create the appointment
            const appointmentId = appointments.length + 1;
            const newAppointment = { id: appointmentId, doctorId, date, time, patientName };
            appointments.push(newAppointment);

            res.statusCode = 201;
            res.end(JSON.stringify(newAppointment));
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
