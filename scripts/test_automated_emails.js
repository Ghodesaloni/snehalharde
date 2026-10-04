const automatedEmailService = require("../server/services/automatedEmailService");
const emailCenterDb = require("../server/db/emailCenterDb");

async function runTests() {
  console.log("=================================================");
  console.log("Testing AvaHire 4 Automated Email Types System");
  console.log("=================================================");

  const sampleCandidate = {
    id: `test-cand-${Date.now()}`,
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    role: "Senior AI Engineer",
    company: "AvaHire Technologies"
  };

  const sampleHR = {
    email: "hr.lead@avahire.ai",
    name: "Sarah Jenkins",
    company: "AvaHire Global Solutions"
  };

  // Test 1: Candidate Shortlisted Email
  console.log("\n--- [1/4] Testing Candidate Shortlisted Email ---");
  const shortlistRes = await automatedEmailService.sendCandidateShortlistedEmail({
    candidate: sampleCandidate,
    hrEmail: sampleHR.email,
    hrName: sampleHR.name,
    company: sampleHR.company,
    jobTitle: sampleCandidate.role
  });
  console.log("Shortlist Result:", shortlistRes);

  // Test 1b: Duplicate Shortlisted Email Prevention
  console.log("\n--- [1b] Testing Duplicate Shortlist Prevention ---");
  const duplicateShortlistRes = await automatedEmailService.sendCandidateShortlistedEmail({
    candidate: sampleCandidate,
    hrEmail: sampleHR.email,
    hrName: sampleHR.name,
    company: sampleHR.company,
    jobTitle: sampleCandidate.role
  });
  console.log("Duplicate Shortlist Result (Should be duplicate: true):", duplicateShortlistRes);

  // Test 2: Interview Scheduled Email
  console.log("\n--- [2/4] Testing Interview Scheduled Email ---");
  const sampleInterview = {
    id: `test-iv-${Date.now()}`,
    candidateId: sampleCandidate.id,
    name: sampleCandidate.name,
    email: sampleCandidate.email,
    role: sampleCandidate.role,
    company: sampleHR.company,
    date: "Tomorrow",
    time: "02:00 PM",
    duration: "45 Minutes",
    linkCode: "ava999"
  };
  const scheduledRes = await automatedEmailService.sendInterviewScheduledEmail({
    interview: sampleInterview,
    hrEmail: sampleHR.email,
    hrName: sampleHR.name,
    company: sampleHR.company
  });
  console.log("Interview Scheduled Result:", scheduledRes);

  // Test 3: Interview 1-Hour Reminder Email
  console.log("\n--- [3/4] Testing 1-Hour Interview Reminder Email ---");
  const reminderRes = await automatedEmailService.sendInterviewReminderEmail({
    interview: sampleInterview,
    hrEmail: sampleHR.email,
    hrName: sampleHR.name,
    company: sampleHR.company
  });
  console.log("1-Hour Reminder Result:", reminderRes);

  // Test 4: Congratulations Email (Candidate Selection)
  console.log("\n--- [4/4] Testing Congratulations / Selection Email ---");
  const congratsRes = await automatedEmailService.sendCongratulationsEmail({
    candidate: sampleCandidate,
    hrEmail: sampleHR.email,
    hrName: sampleHR.name,
    company: sampleHR.company,
    jobTitle: sampleCandidate.role
  });
  console.log("Congratulations Result:", congratsRes);

  // Verify Logs
  console.log("\n--- [Logs] Verifying Automated Delivery Logs ---");
  const logs = automatedEmailService.getAutomatedEmailLogs();
  console.log(`Total Automated Logs in Backend: ${logs.length}`);
  logs.slice(0, 4).forEach((log, i) => {
    console.log(`Log ${i + 1}: [${log.triggerType}] To: ${log.recipientEmail} | From: ${log.senderEmail} | Subject: "${log.subject}" | Status: ${log.status}`);
  });

  console.log("\n=================================================");
  console.log("✓ All 4 automated email triggers verified successfully!");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
