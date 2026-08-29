export const projectsData = [
    {
        id: 1,
        name: 'EUNX Investment LLC Fintech Platform',
        status: 'Under progress currently',
        images: ['/company-logos/eunx.svg'],
        imageKind: 'logo',
        description: "Built secure backend services for a production-grade crypto trading and fintech ecosystem, covering authentication, market data, wallets, payments, KYC, admin operations, audit logging, and real-time communication.",
        details: [
            "Implemented authentication and authorization using Spring Security, JWT, OAuth 2.0, Redis, 2FA, and dynamic RBAC across distributed microservices.",
            "Developed a custom Market Data microservice integrating with OKX and Binance APIs for real-time tickers, candlestick data, and normalized exchange feeds.",
            "Contributed to crypto wallet infrastructure, hot and cold wallet workflows, transaction handling, and Liminal custody operations.",
            "Integrated Zand for fiat payment workflows and Sumsub for KYC verification, onboarding, compliance checks, and regulatory readiness.",
            "Built Admin Dashboard backend systems for user management, compliance workflows, wallet operations, audit visibility, permission controls, and operational tools."
        ],
        techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'WebSockets', 'Docker', 'AWS EC2', 'Amazon RDS', 'JWT', 'OAuth 2.0'],
        role: 'Backend Engineer',
        code: '',
        demo: '',
    },
    {
        id: 2,
        name: 'Biometric Attendance System',
        images: [
            '/project-images/federal-dashboard.png',
            '/project-images/muster-roll.png',
            '/project-images/gar-report.png',
            '/project-images/gar-report-2.png'
        ],
        description: 'Developed a fingerprint-based clock-in and clock-out system integrated with hardware and a redesigned company database, capable of fetching, updating, and storing records from multiple tables within 5 seconds.',
        details: [
            "Generated attendance reports for up to 80,000 records in about 4-5 seconds after the previous process took up to two days.",
            "Implemented complex SQL queries for efficient data retrieval and detailed PDF report generation.",
            "Designed a Python automation script for data fetching workflows.",
            "Built an HR admin dashboard for specific table access and a super admin panel for full table access and editing."
        ],
        techStack: ['Node.js', 'Express.js', "MySQL", "HTML", "CSS", "C++", "Python"],
        role: 'Software Engineer',
        code: '',
        demo: '',
    },
    {
        id: 3,
        name: 'Video Streaming and Social Interaction Application',
        images: [
            '/project-images/stream-hub.png',
            '/project-images/stream-hub-feed.jpeg',
            '/project-images/stream-hub-watch.jpeg'
        ],
        description: 'Developed a hybrid platform enabling users to stream movies while engaging in real-time online interactions, enhancing the social viewing experience.',
        details: [
            "Implemented a user-based recommendation model in Python for personalized movie suggestions based on user preferences.",
            "Built a content-based recommendation model in JavaScript for suggestions tailored to movie attributes.",
            "Supported the interactive streaming experience with Node.js, Express.js, MySQL, Python, HTML, CSS, and JavaScript."
        ],
        techStack: ['Node.js', 'Express.js', 'MySQL', 'Python', 'HTML', 'CSS', 'Javascript'],
        code: '',
        role: 'Software Engineer',
        demo: '',
    },
    {
        id: 4,
        name: 'Data Visualization with AI Features',
        images: [
            '/project-images/data-visualization.png',
            '/project-images/data-filters.png',
            '/project-images/data-table.png'
        ],
        description: "Built a data visualization system that dynamically creates SQL tables from uploaded Excel files and uses backend schema data to generate frontend filter fields.",
        details: [
            "Created SQL tables automatically from uploaded Excel file names and headers for structured storage.",
            "Fetched table schemas from the backend and generated dynamic filter fields from column names.",
            "Converted user-defined filters into SQL queries for efficient retrieval.",
            "Maintained smooth pagination for both filtered and unfiltered records."
        ],
        techStack: ['Python', 'React', 'MySQL', 'Pandas', "Scikit-learn", "Flask"],
        code: '',
        demo: '',
        role: 'Software Engineer',
    },
    {
        id: 5,
        name: 'Portfolio',
        images: [
            '/project-images/portfolio-hero-preview.png',
            '/project-images/portfolio-experience-preview.png',
            '/project-images/portfolio-projects-preview.png',
            '/project-images/portfolio-contact-preview.png'
        ],
        description: "Built a full-stack developer portfolio with a polished Next.js frontend, interactive project showcases, structured career sections, protected contact workflows, and server-side email delivery.",
        details: [
            "Developed the frontend with Next.js, React, Tailwind CSS, Sass, animated Lottie visuals, sticky project cards, responsive sections, and optimized image-driven project previews.",
            "Built backend API routes for contact form handling, input validation, email template generation, SMTP delivery with Nodemailer, and environment-based configuration.",
            "Integrated Google reCAPTCHA verification support and client-side validation to reduce invalid submissions before they reach the email workflow.",
            "Organized profile, skills, education, experience, company logos, CV assets, and project data into reusable data modules for easier updates.",
            "Configured the app for local development and deployment with Next.js metadata, Docker files, environment variables, and static assets served through the public folder."
        ],
        techStack: ['Next.js', 'React', 'JavaScript', 'Tailwind CSS', 'Sass', 'Node.js', 'Nodemailer', 'Axios', 'reCAPTCHA', 'Docker'],
        code: '',
        demo: '',
        role: 'Full Stack Developer',
    }
];


// Do not remove any property.
// Leave it blank instead as shown below

// {
//     id: 1,
//     name: '',
//     description: "",
//     techStack: [],
//     role: '',
//     code: '',
//     demo: '',
// },
