// Troubleshooting Workbench scenario library.
//
// Each scenario is a SAFE SIMULATION: diagnostic "tools" return predefined,
// generated output — no visitor-supplied command is ever executed anywhere.
// Stages drive an interactive engine (see WorkbenchRunner):
//   - info        : narrative (symptoms / triage / impact). Continue.
//   - diagnostic  : run the listed simulated tools; each reveals canned output.
//   - decision    : multiple choice; options mark correct + give feedback.
//   - resolution  : root cause, corrective action, verification, notes, escalate.
//
// `demoLabel` (A–F) marks the recruiter demo scenarios from the master prompt.

export const DIAGNOSTIC_TOOLS = {
  ipconfig: "ipconfig /all",
  ping: "ping",
  tracert: "tracert",
  nslookup: "nslookup",
  netstat: "netstat -ano",
  testnet: "Test-NetConnection",
  getservice: "Get-Service",
  eventlog: "Get-WinEvent (Event Viewer)",
  taskmgr: "Task Manager",
  devmgmt: "Device Manager",
};

export const SCENARIOS = [
  // ---------------------------------------------------------------- A: DNS
  {
    id: "dns-failure",
    demoLabel: "A",
    title: "Cannot reach internal portal — DNS failure",
    category: "Network & Connectivity",
    difficulty: "L1",
    service: "DNS",
    linkedArticleIds: ["kb-dns"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "An employee reports the internal portal (portal.company.example) won't load in any browser ('server IP address could not be found'), but they can reach external sites like bing.com." },
      { type: "info", heading: "Initial triage & impact",
        body: "Single user affected. Other sites work, so this is not a full outage. Impact: Low/Medium, Urgency: Medium. Likely a name-resolution problem, not connectivity." },
      { type: "diagnostic", heading: "Run diagnostics",
        tools: ["ipconfig", "nslookup", "ping"],
        outputs: {
          ipconfig: "Ethernet adapter Ethernet:\n   IPv4 Address. . . : 10.20.4.37\n   Subnet Mask . . . : 255.255.255.0\n   Default Gateway . : 10.20.4.1\n   DNS Servers . . . : 8.8.8.8   <-- public DNS, not corporate",
          nslookup: "> nslookup portal.company.example\nServer:  dns.google\nAddress: 8.8.8.8\n*** dns.google can't find portal.company.example: NXDOMAIN",
          ping: "> ping 10.20.8.15   (portal's known IP)\nReply from 10.20.8.15: bytes=32 time=2ms TTL=128\nReply from 10.20.8.15: bytes=32 time=1ms TTL=128\n(Portal responds by IP — so it's reachable; name lookup is the problem.)",
        } },
      { type: "decision", heading: "What is the most likely root cause?",
        options: [
          { label: "The portal server is down", correct: false, feedback: "No — pinging the portal's IP succeeds, so the server is up and reachable." },
          { label: "The client is using a public DNS server (8.8.8.8) that can't resolve internal names", correct: true, feedback: "Correct. Internal records only exist on the corporate DNS servers; 8.8.8.8 returns NXDOMAIN for internal names." },
          { label: "The default gateway is wrong", correct: false, feedback: "No — the gateway is on-subnet (10.20.4.1) and external browsing works." },
        ] },
      { type: "decision", heading: "Correct corrective action?",
        options: [
          { label: "Set the adapter to obtain DNS automatically (DHCP) so it receives the corporate DNS servers, then ipconfig /flushdns", correct: true, feedback: "Correct. Restoring DHCP-provided corporate DNS (or setting the correct internal DNS servers) fixes internal resolution." },
          { label: "Reboot the portal server", correct: false, feedback: "Unnecessary and disruptive — the server is healthy." },
          { label: "Reinstall the browser", correct: false, feedback: "No — all browsers fail and the issue is DNS, not the browser." },
        ] },
      { type: "resolution",
        rootCause: "Workstation was manually configured with public DNS (8.8.8.8), which cannot resolve internal-only hostnames.",
        correctiveAction: "Reset the adapter to obtain DNS automatically via DHCP (or set the corporate internal DNS servers), then run `ipconfig /flushdns`.",
        verification: "`nslookup portal.company.example` now resolves to 10.20.8.15 and the portal loads in the browser.",
        resolutionNotes: "DNS misconfiguration corrected; internal name resolution restored and verified with the user.",
        escalateTo: null },
    ],
  },

  // ------------------------------------------------------- B: Account lockout
  {
    id: "account-lockout",
    demoLabel: "B",
    title: "Employee cannot sign in — account lockout",
    category: "Identity & Access",
    difficulty: "L1",
    service: "Account Lockout",
    linkedArticleIds: ["kb-lockout", "kb-pw-reset"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "An employee calls: 'I keep getting Your account is locked. I didn't change anything.' They need access urgently for a client meeting." },
      { type: "info", heading: "Identity verification (required first)",
        body: "Before any account action, verify identity using the approved process (e.g. manager callback / knowledge-based verification). Never reset or unlock based on an inbound claim alone." },
      { type: "diagnostic", heading: "Check account status (simulated directory)",
        tools: ["eventlog"],
        outputs: {
          eventlog: "Security log (DC): Event 4740 — User account locked out.\n  Account: d.whitfield\n  Caller Computer: LAPTOP-OLD-7  <-- an old device still trying a stale cached password\n  Lockouts: 1 (threshold 5 bad attempts in 15 min)",
        } },
      { type: "decision", heading: "Best next step?",
        options: [
          { label: "Unlock the account via the approved procedure, and identify the source of the bad attempts (the old device's cached credential)", correct: true, feedback: "Correct — unlock to restore access, but also resolve the lockout source so it doesn't recur." },
          { label: "Just unlock and close the ticket", correct: false, feedback: "Partial — unlocking restores access, but without removing the stale credential on LAPTOP-OLD-7 it will lock again." },
          { label: "Reset the password immediately without verifying identity", correct: false, feedback: "No — identity must be verified first, and a reset isn't required if the password itself is valid." },
        ] },
      { type: "resolution",
        rootCause: "An old device (LAPTOP-OLD-7) repeatedly authenticated with a stale cached password, tripping the lockout threshold.",
        correctiveAction: "Verify identity → unlock the account via the approved admin procedure → remove/refresh the cached credential on the old device (or sign it out of corporate accounts).",
        verification: "User signs in successfully; no new 4740 lockout events appear over the next monitoring window.",
        resolutionNotes: "Account unlocked after identity verification; lockout source (stale cached credential on a retired device) removed. This is an authorized, simulated administrative action — recorded in the audit log.",
        escalateTo: null },
    ],
  },

  // -------------------------------------------------- C: Outlook auth failure
  {
    id: "outlook-auth",
    demoLabel: "C",
    title: "Outlook keeps prompting for credentials (M365)",
    category: "Email & Microsoft 365",
    difficulty: "L2",
    service: "Outlook",
    linkedArticleIds: ["kb-outlook-sync", "kb-mfa"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "Outlook desktop repeatedly prompts for a password and never connects; Outlook on the web works fine with the same credentials." },
      { type: "info", heading: "Triage & impact",
        body: "Web access working narrows this to the desktop client / cached auth token, not the mailbox or the account itself. Single user, Medium impact." },
      { type: "diagnostic", heading: "Checks",
        tools: ["testnet", "getservice"],
        outputs: {
          testnet: "Test-NetConnection outlook.office365.com -Port 443\n  TcpTestSucceeded : True   (connectivity to M365 is fine)",
          getservice: "Credential Manager stored tokens: 1 stale MSAL token for the user (expired)\nModern authentication (OAuth): Enabled on tenant",
        } },
      { type: "decision", heading: "Most likely cause?",
        options: [
          { label: "A corrupt/stale cached credential (MSAL token) in the Windows Credential Manager / Office identity cache", correct: true, feedback: "Correct — web works, connectivity is fine, so the desktop client's cached token is the culprit." },
          { label: "The mailbox is corrupt", correct: false, feedback: "Unlikely — Outlook on the web reads the same mailbox without issue." },
          { label: "The tenant has blocked the user", correct: false, feedback: "No — the account authenticates fine on the web." },
        ] },
      { type: "decision", heading: "Corrective action?",
        options: [
          { label: "Clear the stale cached credentials (Credential Manager + Office identity), then re-authenticate (completing MFA)", correct: true, feedback: "Correct — removing the stale token forces a fresh modern-auth sign-in." },
          { label: "Rebuild the Windows profile", correct: false, feedback: "Overkill before clearing the credential cache." },
          { label: "Disable modern authentication for the tenant", correct: false, feedback: "No — that weakens security for everyone and isn't the cause." },
        ] },
      { type: "resolution",
        rootCause: "Stale/expired cached modern-auth token in the Office identity / Windows Credential Manager prevented the desktop client from completing sign-in.",
        correctiveAction: "Remove the stale cached credentials, restart Outlook, and re-authenticate (completing MFA).",
        verification: "Outlook connects without repeated prompts; send/receive succeeds.",
        resolutionNotes: "Cleared stale credential cache; re-authenticated with MFA. No tenant changes required.",
        escalateTo: null },
    ],
  },

  // ----------------------------------------------------------- D: VPN failure
  {
    id: "vpn-connectivity",
    demoLabel: "D",
    title: "Remote employee cannot connect to the VPN",
    category: "Network & Connectivity",
    difficulty: "L2",
    service: "VPN",
    linkedArticleIds: ["kb-vpn"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "A remote employee's VPN client fails to connect from home ('negotiation timed out'). They can browse the internet normally." },
      { type: "diagnostic", heading: "Diagnostics",
        tools: ["ping", "testnet", "nslookup"],
        outputs: {
          nslookup: "nslookup vpn.company.example -> 203.0.113.50 (resolves correctly)",
          ping: "ping 203.0.113.50 -> Request timed out (ICMP may be filtered — inconclusive)",
          testnet: "Test-NetConnection vpn.company.example -Port 443 -> TcpTestSucceeded : True\nTest-NetConnection vpn.company.example -Port 4500 (IKEv2/NAT-T UDP) -> FAILED",
        } },
      { type: "decision", heading: "What does the evidence point to?",
        options: [
          { label: "The VPN name resolves and 443 is reachable, but the IKEv2/NAT-T UDP port (4500) needed for the tunnel is blocked on the local network", correct: true, feedback: "Correct — the control port is reachable but the tunnel transport (UDP 4500/500) is blocked, typical of a restrictive home/hotel network." },
          { label: "DNS is broken", correct: false, feedback: "No — vpn.company.example resolves correctly." },
          { label: "The VPN gateway is down", correct: false, feedback: "Unlikely — TCP 443 to the gateway succeeds." },
        ] },
      { type: "decision", heading: "Appropriate corrective action?",
        options: [
          { label: "Switch the client to a TCP/443-based tunnel (SSL-VPN fallback) or have the user try a different network / mobile hotspot", correct: true, feedback: "Correct — using the TCP fallback or an unrestricted network bypasses the UDP block." },
          { label: "Reinstall Windows", correct: false, feedback: "No — unrelated and disruptive." },
          { label: "Open UDP 4500 on the corporate firewall", correct: false, feedback: "The block is on the user's local network, not the corporate side." },
        ] },
      { type: "resolution",
        rootCause: "The user's local network blocks the UDP ports (500/4500) required for the IKEv2 tunnel; the gateway itself is healthy.",
        correctiveAction: "Use the client's TCP/443 SSL-VPN fallback mode, or connect from an unrestricted network / mobile hotspot.",
        verification: "VPN connects; the user reaches internal resources.",
        resolutionNotes: "Identified local-network UDP block via Test-NetConnection; switched to TCP fallback. Documented for other remote users on restrictive networks.",
        escalateTo: "Network Support" },
    ],
  },

  // ------------------------------------------------ E: Critical service outage
  {
    id: "critical-outage",
    demoLabel: "E",
    title: "Multiple users — shared file service outage (P1)",
    category: "Network & Connectivity",
    difficulty: "L3",
    service: "File Services",
    linkedArticleIds: [],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "Within minutes, the Service Desk receives 12+ calls: nobody in the Finance and Sales departments can open files on the shared drive (\\\\fs01\\shared). This is a shared-service interruption." },
      { type: "info", heading: "P1 declaration & impact",
        body: "Multiple users, a shared business service, work stopped → High impact + High urgency = P1 Critical. Declare a major incident: assign an incident coordinator, open a comms channel, and keep stakeholders updated on the SLA clock (P1 resolution target 4h)." },
      { type: "diagnostic", heading: "Diagnostics",
        tools: ["ping", "getservice", "eventlog"],
        outputs: {
          ping: "ping fs01 -> Reply (the server host is up)",
          getservice: "Get-Service LanmanServer (Server) on FS01 -> Status: Stopped  <-- file-sharing service is stopped",
          eventlog: "System log FS01: Event 7036 — 'Server' service entered the stopped state at 09:14, shortly after a patch-related restart.",
        } },
      { type: "decision", heading: "Fastest correct restoration step?",
        options: [
          { label: "Start the stopped 'Server' (LanmanServer) service on FS01 and set it to start automatically, then confirm shares are accessible", correct: true, feedback: "Correct — the host is up but the file-sharing service stopped after a patch restart; starting it restores shares immediately." },
          { label: "Fail over to the DR site", correct: false, feedback: "Disproportionate — the fix is a single service restart; DR failover adds risk and time." },
          { label: "Rebuild the file server", correct: false, feedback: "No — massively disruptive and unnecessary." },
        ] },
      { type: "resolution",
        rootCause: "The 'Server' (LanmanServer) service on FS01 failed to auto-start after a patch-related reboot, stopping all SMB file sharing.",
        correctiveAction: "Start the LanmanServer service, set startup to Automatic, and verify shares. Raise a Problem record to fix the start dependency so it doesn't recur after patching.",
        verification: "Affected users reopen files on \\\\fs01\\shared; monitoring confirms SMB sessions re-establishing.",
        resolutionNotes: "P1 resolved by restarting the file-sharing service. Post-incident: Problem record opened for the patch/startup dependency; comms sent to Finance and Sales.",
        escalateTo: "Specialist Support L3" },
    ],
  },

  // ---------------------------------------------- F: Onboarding (service req)
  {
    id: "onboarding",
    demoLabel: "F",
    title: "New-hire onboarding (account + licenses + equipment)",
    category: "Identity & Access",
    difficulty: "L2",
    service: "Onboarding",
    linkedArticleIds: ["kb-license"],
    stages: [
      { type: "info", heading: "Request",
        body: "HR submits a Service Request to onboard a new Finance analyst starting Monday: account, email, standard app access, an M365 license, and a laptop + dock." },
      { type: "info", heading: "Approvals & least privilege",
        body: "Onboarding touches identity, licensing, and equipment — each step follows least privilege and, where required, an approval (e.g. the hiring manager approves access; license assignment is recorded). Nothing is granted beyond the standard Finance role profile without approval." },
      { type: "decision", heading: "Correct order of operations?",
        options: [
          { label: "Create the account → assign to the Finance security groups (standard profile) → assign the M365 license → provision mailbox → assign & image the laptop/dock → record everything", correct: true, feedback: "Correct — identity first, then group-based access, license, mailbox, then equipment, with each step recorded for audit." },
          { label: "Hand the laptop over first and sort access out later", correct: false, feedback: "No — equipment without provisioned, least-privilege access creates security gaps and a poor first day." },
          { label: "Grant admin rights so they can install whatever they need", correct: false, feedback: "Never — this violates least privilege; standard users don't get admin by default." },
        ] },
      { type: "decision", heading: "Which access model is appropriate?",
        options: [
          { label: "Role/group-based access matching the Finance analyst profile (so membership drives permissions)", correct: true, feedback: "Correct — group-based access is auditable, repeatable, and easy to revoke at offboarding." },
          { label: "Copy all permissions from a random existing user", correct: false, feedback: "No — 'permission cloning' spreads excess access and is hard to audit." },
        ] },
      { type: "resolution",
        rootCause: "N/A — this is a Service Request (provisioning), not an incident.",
        correctiveAction: "Provision via the standard onboarding workflow: account → Finance groups → M365 license → mailbox → equipment, each with the required approval and recorded in the audit log.",
        verification: "New hire signs in on day one with the correct, least-privilege access and working equipment; the hiring manager confirms.",
        resolutionNotes: "Simulated onboarding completed through approved workflow. Access is group-based for clean offboarding later. All administrative actions are simulated and audit-logged.",
        escalateTo: null },
    ],
  },

  // ------------------------------------------------- Windows slow performance
  {
    id: "slow-workstation",
    title: "Workstation extremely slow / high disk usage",
    category: "Hardware",
    difficulty: "L1",
    service: "Performance",
    linkedArticleIds: ["kb-perf"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "A user's laptop is 'crawling' — apps take a long time to open and the fan runs constantly. It started after the machine was left on for a week." },
      { type: "diagnostic", heading: "Diagnostics",
        tools: ["taskmgr", "eventlog"],
        outputs: {
          taskmgr: "Task Manager → Processes (sorted by Disk):\n  'Antimalware Service Executable' — Disk 100%, prolonged\n  Disk: 100% sustained; CPU 35%; Memory 68%\n  Uptime: 7 days 4 hours",
          eventlog: "No disk SMART errors; no application crash events. Pending Windows Update reboot flagged.",
        } },
      { type: "decision", heading: "Most likely cause & first action?",
        options: [
          { label: "A long-running background scan + a pending update reboot; reboot to clear state and let the scan finish, then re-check", correct: true, feedback: "Correct — 7-day uptime with a pending-reboot update and a sustained background scan is a classic transient-performance cause; a reboot often resolves it." },
          { label: "Failing hard disk — replace it immediately", correct: false, feedback: "No — SMART reports no errors; don't swap hardware without evidence." },
          { label: "Reimage the machine", correct: false, feedback: "Premature and disruptive before basic triage." },
        ] },
      { type: "resolution",
        rootCause: "High disk contention from a prolonged background scan combined with a pending update reboot after 7 days of uptime.",
        correctiveAction: "Reboot to apply the pending update and clear state; allow the background scan to complete; confirm disk returns to normal. If 100% disk persists, review startup impact and storage health.",
        verification: "After reboot, disk usage settles to normal and apps open promptly.",
        resolutionNotes: "Performance restored after reboot and update completion. Advised the user to reboot weekly.",
        escalateTo: null },
    ],
  },

  // ----------------------------------------------------- Network printer down
  {
    id: "printer-offline",
    title: "Network printer shows offline for a whole floor",
    category: "Printing",
    difficulty: "L1",
    service: "Network Printer",
    linkedArticleIds: ["kb-printer"],
    stages: [
      { type: "info", heading: "Reported symptoms",
        body: "Everyone on floor 2 says the shared printer (PRN-FL2) is 'offline'. Jobs sit in the queue." },
      { type: "diagnostic", heading: "Diagnostics",
        tools: ["ping", "getservice"],
        outputs: {
          ping: "ping prn-fl2 -> Request timed out\nping 10.20.6.40 (printer IP) -> Request timed out  (printer not responding on the network)",
          getservice: "Print Spooler on print server: Running. Queue: 14 jobs held.",
        } },
      { type: "decision", heading: "Where is the fault?",
        options: [
          { label: "The printer itself is off the network (no ping by name or IP); check power/network cable/printer NIC before touching the server", correct: true, feedback: "Correct — the spooler is healthy and the device doesn't answer on the network, so the fault is at the device/physical layer." },
          { label: "The print spooler service is crashed", correct: false, feedback: "No — the spooler is Running; jobs are queued because the device is unreachable." },
          { label: "Every PC on the floor needs the driver reinstalled", correct: false, feedback: "Unlikely — a whole-floor outage with no device ping points to the printer, not each client." },
        ] },
      { type: "resolution",
        rootCause: "The printer dropped off the network (power/network/NIC), so queued jobs could not be delivered.",
        correctiveAction: "Check the printer's power and network connection / switch port; power-cycle the printer; confirm it pulls an IP and responds to ping; release the held queue.",
        verification: "Printer responds to ping, status returns to Ready, and held jobs complete.",
        resolutionNotes: "Restored the printer's network connectivity; queue cleared. If the port was down, flagged to Network Support.",
        escalateTo: "Network Support" },
    ],
  },
];

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id) || null;
}

export function scenariosForService(service) {
  if (!service) return [];
  const needle = String(service).toLowerCase();
  return SCENARIOS.filter(
    (s) =>
      s.service?.toLowerCase() === needle ||
      s.title.toLowerCase().includes(needle) ||
      s.category.toLowerCase().includes(needle)
  );
}
