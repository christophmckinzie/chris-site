// Resume content, taken from the quiz repo's Resume.jsx (the newer copy).
// Each article: optional title, optional link { to } (in-app) or { href } (external),
// optional sub lines, optional bullets, or `blocks` for the Key Skills layout.

export const contact = [
  { label: "Email", text: "chris@chrisjonessoftware.com", href: "mailto:chrismjones81@gmail.com" },
  { label: "Website", text: "http://www.chrisjonessoftware.com", href: "http://www.chrisjonessoftware.com" },
  { label: "GitHub", text: "github.com/christophmckinzie", href: "https://github.com/christophmckinzie" },
];

export const sections = [
  {
    title: "Work Experience",
    groups: [
      [{
        title: "Software Engineer",
        sub: ["US Biotek Laboratory, August 2025 - Present"],
        bullets: [
          "Built and maintained proprietary lab information system in PHP and Ruby (sometimes on Rails).",
          "Wrote and optimized SQL queries and database schemas to support application features.",
          "Developed interactive front-end components with JavaScript.",
          "Automated deployment and routine tasks using Bash scripts.",
        ],
      }],
      [{
        title: "Lead Laboratory Technician",
        sub: ["US Biotek Laboratory, March 2022 - July 2025"],
        bullets: [
          "Created and maintained an experimental design application in Python using PyQt framework that interfaces with VisionMate™ barcode reader.",
          "Created and maintained software for the automated printing of patient sample labels, ordering software, and interfacing with internal LIS for results transfer.",
          // NOTE: the source text is cut off ("... and sample ."). Kept as-is for Chris to fix.
          "Developed Excell (Visual Basic scripting) templates for data processing and sample .",
          "Trained and supervised employees on laboratory duties.",
        ],
      }],
      [{
        title: "Technician I-II",
        sub: ["US Biotek Laboratory, March 2018 - March 2022"],
        bullets: [
          "Conducted patient preparation/testing using Biocell 1200/BioSero robotic systems, Inova BIO-FLASH, Siemens Immulite 2000xpi, KingFisher Flex, and 7500 Fast Dx RT-PCR instruments.",
          "Revision of SOPs, internal logs and forms.",
        ],
      }],
    ],
  },
  {
    title: "Education",
    groups: [
      [
        { title: "University of Oregon", sub: ["Computer Science - Bachelor of Science"] },
        { title: "Western Washington University", sub: ["Biochemistry - Bachelor of Science", "Mathematics - Minor"] },
      ],
    ],
  },
  {
    title: "Personal Projects",
    groups: [
      [
        {
          title: "Geography Quiz",
          link: { to: "/quiz" },
          bullets: [
            "Developed an interactive React application utilizing Mapbox for a geographic quiz of world countries and Seattle neighborhoods.",
            "Implemented dynamic map interactions and real-time feedback for user engagement.",
          ],
        },
        {
          title: "Weather On Route",
          link: { to: "/weather-routing" },
          bullets: [
            "Python application created using PyQt framework, Google Maps API and OpenWeather API.",
            "Web application version created for this website using Flask and Solid.",
            "Finds weather along route with most inclement weather at each location displayed (snow->rain->clouds->clear). Links to full forecast at found locations.",
          ],
        },
        {
          title: "Trading Strategy Analysis (NDA Signed)",
          bullets: [
            "Capstone project using Flask, AWS EC2/Elastic Beanstalk and MongoDB.",
            "Multi-objective optimization (NSGA-II) of backtesting strategies used in trading 3xETFs.",
          ],
        },
      ],
    ],
  },
  {
    title: "Key Skills",
    groups: [
      [
        {
          blocks: [
            { title: "Languages", bullets: ["Python, PHP, Ruby, SQL, HTML, Javascript"] },
            { title: "Frameworks & Libraries", bullets: ["Rails, PyQt, Flask, FastAPI", "NumPy, Pandas, SQLAlchemy, Folium"] },
            { title: "Tools & Platforms", bullets: ["VS Code, Git, Linux, AWS, PostgresSQL, MySQL, MongoDB"] },
          ],
        },
      ],
    ],
  },
];
