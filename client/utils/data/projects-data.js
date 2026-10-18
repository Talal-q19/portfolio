export const projectsData = [
    {
        id: 1,
        name: 'EUNX Investment LLC Fintech Platform',
        status: 'In progress',
        statusType: 'in-progress',
        outcome: 'Contributing to a secure, multi-region fintech and crypto-trading platform across European, UAE, and UK market-readiness initiatives.',
        images: ['/company-logos/eunx.svg'],
        imageKind: 'logo',
        description: 'Backend Engineer for a production-grade fintech and cryptocurrency platform supporting trading, wallets, payments, KYC, compliance, market data, and internal administrative operations.',
        details: [
            'Build and maintain Spring Boot services and secure REST APIs for customer applications and the Admin Dashboard, including trading controls, wallet operations, transaction monitoring, audit visibility, RBAC, and secure administrative actions.',
            'Contribute to backend controls, compliance workflows, auditability, and platform requirements supporting regulatory and technical readiness for European MiCA-related and UAE VARA-related expansion.',
            'Develop crypto-wallet workflows for hot and cold wallets, deposits, withdrawals, transaction processing, and integration with trading, account, and transaction services.',
            'Integrated Zand for fiat wallet and payment flows and Sumsub for automated KYC onboarding, identity checks, verification status handling, and compliance workflows.',
            'Built a Strapi-based service for multilingual legal and regulatory content, using backend APIs, AWS publish/subscribe messaging, and webhooks for event-driven synchronization across services.',
            'Improve reliability through unit and integration testing, SonarQube quality work, Jenkins CI/CD, Kafka, WebSockets, Redis, and production release and incident debugging.'
        ],
        techStack: ['Java', 'Spring Boot', 'Spring Security', 'JWT', 'OAuth 2.0', 'PostgreSQL', 'Redis', 'Kafka', 'WebSockets', 'REST APIs', 'Docker', 'AWS EC2/RDS', 'AWS Pub/Sub', 'Webhooks', 'Strapi', 'Jenkins', 'SonarQube', 'Zand', 'Sumsub', 'Binance API', 'OKX API'],
        role: 'Backend Engineer · Full-Time',
        code: '',
        demo: '',
    },    {
        id: 2,
        name: 'Biometric Attendance System',
        status: 'Completed',
        statusType: 'completed',
        outcome: 'Reduced reporting for up to 80,000 records from as long as two days to about 4–5 seconds.',
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
        status: 'Completed',
        statusType: 'completed',
        outcome: 'Combined live social viewing with both user-based and content-based movie recommendations.',
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
        status: 'Completed',
        statusType: 'completed',
        outcome: 'Turned uploaded spreadsheet schemas into dynamic SQL tables, filters, and paginated results.',
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
        status: 'Live',
        statusType: 'live',
        outcome: 'Created a responsive portfolio with protected contact workflows and reusable content modules.',
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
