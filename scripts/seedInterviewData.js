require("dotenv").config();
const mongoose = require("mongoose");
const { Category, JobTitle, slugify } = require("../src/models/interview.model");

const DATA = [
  {
    name: "IT & Software",
    kind: "professional",
    skillLabel: "Skill",
    icon: "code",
    color: "#315eff",
    titles: [
      "Full Stack Developer",
      "Frontend Developer",
      "Backend Developer",
      "MERN Stack Developer",
      ".NET Developer",
      "Software Engineer",
      "Data Scientist",
      "Data Analyst",
      "DevOps Engineer",
      "Mobile App Developer",
      "System Administrator",
      "UI/UX Designer",
      "QA / Test Engineer",
    ],
  },
  {
    name: "Law",
    kind: "student",
    skillLabel: "Subject",
    icon: "law",
    color: "#8254e8",
    titles: [
      "LLB Student",
      "LLM Student",
      "CLAT Aspirant",
      "Judiciary Exam Aspirant",
      "Junior Advocate",
      "Legal Associate",
    ],
  },
  {
    name: "School (Class 6-12)",
    kind: "student",
    skillLabel: "Subject",
    icon: "school",
    color: "#0e9c72",
    titles: [
      "Class 6-8 Student",
      "Class 9 Student",
      "Class 10 Student",
      "Class 11 Student",
      "Class 12 - Science",
      "Class 12 - Commerce",
      "Class 12 - Arts",
    ],
  },
  {
    name: "College & University",
    kind: "student",
    skillLabel: "Subject",
    icon: "college",
    color: "#18a8ee",
    titles: [
      "B.Tech / BE Student",
      "B.Com Student",
      "BBA Student",
      "BA Student",
      "B.Sc Student",
      "BCA Student",
      "MBA Student",
      "M.Tech Student",
      "Fresher / Campus Placement",
    ],
  },
  {
    name: "Medical & Healthcare",
    kind: "professional",
    skillLabel: "Topic",
    icon: "medical",
    color: "#e5484d",
    titles: [
      "NEET Aspirant",
      "MBBS Student",
      "Nurse",
      "Pharmacist",
      "Lab Technician",
    ],
  },
  {
    name: "Commerce & Finance",
    kind: "professional",
    skillLabel: "Skill",
    icon: "business",
    color: "#e59b13",
    titles: [
      "Accountant",
      "CA / CMA Aspirant",
      "Financial Analyst",
      "Banking Professional",
      "Sales Executive",
      "HR Executive",
      "Marketing Executive",
      "Operations Manager",
      "Business Analyst",
    ],
  },
  {
    name: "Government Exams",
    kind: "student",
    skillLabel: "Subject",
    icon: "college",
    color: "#6d35db",
    titles: [
      "UPSC Aspirant",
      "SSC Aspirant",
      "Banking Exam Aspirant",
      "Railway Exam Aspirant",
      "State PSC Aspirant",
    ],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let order = 0;
  let count = 0;
  for (const c of DATA) {
    const category = await Category.findOneAndUpdate(
      { slug: slugify(c.name) },
      {
        $set: {
          kind: c.kind,
          skillLabel: c.skillLabel,
          icon: c.icon,
          color: c.color,
          order: order++,
          isActive: true,
        },
        $setOnInsert: { name: c.name, slug: slugify(c.name) },
      },
      { upsert: true, new: true },
    );

    const ops = c.titles.map((title) => ({
      updateOne: {
        filter: { slug: slugify(title) },
        update: {
          $set: { categoryId: category._id, isActive: true, isCustom: false },
          $setOnInsert: { title, slug: slugify(title) },
        },
        upsert: true,
      },
    }));
    await JobTitle.bulkWrite(ops);
    count += ops.length;
  }

  console.log(
    `Seeded ${DATA.length} categories, ${count} job titles / courses`,
  );
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
