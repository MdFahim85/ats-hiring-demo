import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

import UserModel, { addUserSchema, User } from "../../models/User";
import JobModel, { addJobSchema, Job } from "../../models/Job";
import ApplicationModel, {
  addApplicationSchema,
  Application,
} from "../../models/Application";
import InterviewModel, {
  addInterviewSchema,
  Interview,
} from "../../models/Interview";

const datas: {
  users: User[];
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
} = {
  users: [],
  jobs: [],
  applications: [],
  interviews: [],
};

/* ----------------------------- USERS ----------------------------- */
const makeUser = async () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = faker.person.fullName({ firstName, lastName });

  const user = await addUserSchema.parseAsync({
    id: -1,
    email: faker.internet.email({ firstName, lastName }),
    password: await bcrypt.hash(faker.internet.password(), 10),
    role: faker.helpers.arrayElement([
      "candidate",
      "hr",
      "admin",
    ] satisfies User["role"][]),
    name,
    phone: faker.phone.number(),
    department: faker.commerce.department(),
    profilePicture: faker.image.avatar(),
    cvUrl: faker.internet.url(),
    status: "active",
    createdAt: new Date(),
    googleAccessToken: null,
    googleRefreshToken: null,
  } satisfies User);

  const result = await UserModel.addUser(user);
  if (!result) throw new Error("User not created");

  datas.users.push(result);
};

/* ----------------------------- JOBS ----------------------------- */
const makeJob = async () => {
  const hrUsers = datas.users.filter((u) => u.role === "hr");
  if (!hrUsers.length) return;

  const { id: hrId } = faker.helpers.arrayElement(hrUsers);

  const job = await addJobSchema.parseAsync({
    id: -1,
    title: faker.person.jobTitle(),
    department: faker.commerce.department(),
    description: faker.lorem.paragraphs(2),
    requirements: faker.lorem.paragraphs(2),
    salaryRange: "$50k - $90k",
    jobType: faker.helpers.arrayElement(["full-time", "part-time", "contract"]),
    deadline: faker.date.future(),
    status: faker.helpers.arrayElement([
      "draft",
      "active",
      "closed",
    ] satisfies Job["status"][]),
    hrId,
    createdAt: new Date(),
  } satisfies Job);

  const result = await JobModel.addJob(job);
  if (!result) throw new Error("Job not created");

  datas.jobs.push(result);
};

/* -------------------------- APPLICATIONS -------------------------- */
const makeApplication = async () => {
  const candidates = datas.users.filter((u) => u.role === "candidate");
  if (!candidates.length || !datas.jobs.length) return;

  const { id: candidateId } = faker.helpers.arrayElement(candidates);
  const { id: jobId } = faker.helpers.arrayElement(datas.jobs);

  const application = await addApplicationSchema.parseAsync({
    id: -1,
    jobId,
    candidateId,
    status: faker.helpers.arrayElement([
      "applied",
      "shortlisted",
      "interview",
      "rejected",
      "hired",
    ] satisfies Application["status"][]),
    coverLetter: faker.lorem.paragraph(),
    notes: faker.lorem.sentence(),
    appliedAt: new Date(),
  } satisfies Application);

  const result = await ApplicationModel.addApplication(application);
  if (!result) throw new Error("Application not created");

  datas.applications.push(result);
};

/* --------------------------- INTERVIEWS --------------------------- */
const makeInterview = async () => {
  if (!datas.applications.length) return;

  const application = faker.helpers.arrayElement(datas.applications);
  const hrUsers = datas.users.filter((u) => u.role === "hr");

  const interview = await addInterviewSchema.parseAsync({
    id: -1,
    applicationId: application.id,
    jobId: application.jobId,
    candidateId: application.candidateId,
    interviewDate: faker.date.future(),
    duration: faker.helpers.arrayElement([30, 45, 60]),
    type: faker.helpers.arrayElement([
      "virtual",
      "in_person",
    ] satisfies Interview["type"][]),
    interviewerId: faker.helpers.arrayElement(hrUsers).id,
    meetingLink: faker.internet.url(),
    status: faker.helpers.arrayElement([
      "not_scheduled",
      "scheduled",
      "completed",
    ] satisfies Interview["status"][]),
    preparationNotes: faker.lorem.sentence(),
    feedback: faker.lorem.paragraph(),
    rating: faker.number.int({ min: 1, max: 5 }),
    result: faker.helpers.arrayElement(["pending", "passed", "failed"]),
    createdAt: new Date(),
    calendarEventId: null,
  } satisfies Interview);

  const result = await InterviewModel.addInterview(interview);
  if (!result) throw new Error("Interview not created");

  datas.interviews.push(result);
};

/* ------------------------------ RUN ------------------------------ */
(async () => {
  const users = await UserModel.getAllUsers();
  const jobs = await JobModel.getJobs();
  const applications = await ApplicationModel.getApplications();
  const interviews = await InterviewModel.getInterviews();

  datas.users = datas.users.concat(users);
  datas.jobs = datas.jobs.concat(jobs);
  datas.applications = datas.applications.concat(applications);
  datas.interviews = datas.interviews.concat(interviews);

  for (let i = 0; i < 100 - datas.users.length; i++) {
    try {
      await makeUser();
    } catch (e) {
      console.error(e);
    }
  }

  for (let i = 0; i < 100 - datas.jobs.length; i++) {
    try {
      await makeJob();
    } catch (e) {
      console.error(e);
    }
  }

  for (let i = 0; i < 200 - datas.applications.length; i++) {
    try {
      await makeApplication();
    } catch (e) {
      console.error(e);
    }
  }

  for (let i = 0; i < 100 - datas.interviews.length; i++) {
    try {
      await makeInterview();
    } catch (e) {
      console.error(e);
    }
  }

  console.log("Seeding recruitment database done");
})();
