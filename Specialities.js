const http = require('http');
const url = require('url');

// Sample data for clinic specializations
const specializations = [
    { id: 1, name: "Cardiology" },
    { id: 2, name: "Dermatology" },
    { id: 3, name: "Neurology" },
    { id: 4, name: "Pediatrics" }
];

// Create an HTTP server
const server = http.createServer((req, res) => {
    console.log(`Request URL: ${req.url}`); // Log the full URL
    const parsedUrl = url.parse(req.url, true); // Parse URL and query string
    const pathname = parsedUrl.pathname; // Extract the pathname
    console.log(`Pathname: ${pathname}`); // Log the pathname
    const normalizedPathname = pathname.replace(/\/$/, ""); // Normalize path
    const method = req.method;

    console.log(`Pathname: ${normalizedPathname}`); // Log the normalized pathname

    // Set response headers
    res.setHeader('Content-Type', 'application/json');

    // Handle GET /api/specializations
    if (normalizedPathname === '/api/specializations' && method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify(specializations));
    }
    // Handle GET /api/specializations/:id
    else if (normalizedPathname.startsWith('/api/specializations/') && method === 'GET') {
        const id = parseInt(normalizedPathname.split('/')[3]); // Extract ID from URL

        const specialization = specializations.find(s => s.id === id);

        if (specialization) {
            res.statusCode = 200;
            res.end(JSON.stringify(specialization));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Specialization not found" }));
        }
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
