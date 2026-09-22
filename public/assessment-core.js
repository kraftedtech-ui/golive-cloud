/**
 * assessment-core.js: shared candidate assessment logic.
 *
 * Extracted from the four per-role assessment HTML files, which each carried
 * their own copy. Logic is unchanged; only the five places that hardcoded a
 * role name now read from ROLE.
 *
 * Depends on one declaration supplied by the HTML file:
 *   ROLE: { name, heading, intro, count, minutes }
 *
 * The questions are NOT in the page. Since September 2026 the server issues
 * each candidate's paper when they click Begin, without answers, and marks
 * the submission itself. The browser sends only the choices made.
 */

const TOTAL=(ROLE.minutes||30)*60
let QUESTIONS=[]
let st={phase:'code-gate',codeVerified:false,consentGiven:false,candidateName:'',candidateEmail:'',candidateRole:'',appRef:'',camGranted:false,stream:null,recorder:null,chunks:[],recBlob:null,violations:[],tabSwitches:0,pasteTries:0,current:0,answers:{},textAnswers:{},secs:TOTAL,timerInterval:null}

function logV(msg){const t=new Date().toLocaleTimeString();st.violations.push(`[${t}] ${msg}`)}
function fmt(s){const m=Math.floor(s/60),ss=s%60;return `${m}:${ss.toString().padStart(2,'0')}`}

function render(){document.getElementById('app').innerHTML=renderPhase();attach()}

function renderPhase(){
  if(st.phase==='code-gate')return renderCodeGate()
  if(st.phase==='consent')return renderConsent()
  if(st.phase==='declined')return renderDeclined()
  if(st.phase==='save-later')return renderSaveLater()
  if(st.phase==='intake')return renderIntake()
  if(st.phase==='ref-confirm')return renderRefConfirm()
  if(st.phase==='gate')return renderGate()
  if(st.phase==='confirm')return renderConfirm()
  if(st.phase==='quiz')return renderQuiz()
  if(st.phase==='uploading')return renderUploading()
  return renderResult()
}

function renderCodeGate(){return `
<div style="text-align:center;padding:1rem 0 1.5rem">
  <h2 class="page-title">GoLive Careers</h2>
  <p class="page-sub" style="max-width:400px;margin:0 auto 1.5rem">This assessment is by invitation only. Enter the access code sent to you by the GoLive LinkedIn page to continue.</p>
</div>
<div class="card">
  <div style="margin-bottom:1rem">
    <label style="display:block;font-size:13px;font-weight:500;color:var(--slate);margin-bottom:5px">Role applying for <span style="color:var(--danger)">*</span></label>
    <select id="cg-role" disabled style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--slate);background:#fff" onchange="document.getElementById('cg-err').textContent=''">
      <option value="${ROLE.name}" selected>${ROLE.name}</option>
    </select>
  </div>
  <div style="margin-bottom:0.5rem">
    <label style="display:block;font-size:13px;font-weight:500;color:var(--slate);margin-bottom:5px">Access code <span style="color:var(--danger)">*</span></label>
    <input type="text" id="cg-code" placeholder="Enter your access code" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--slate);background:#fff;letter-spacing:0.1em;text-transform:uppercase" oninput="this.value=this.value.toUpperCase();document.getElementById('cg-err').textContent=''">
  </div>
  <p style="font-size:11px;color:var(--muted);margin-top:6px">Don't have a code? Message the <a href="https://www.linkedin.com/company/51717921" target="_blank" style="color:var(--teal);text-decoration:none;font-weight:500">GoLive LinkedIn page</a> expressing your interest.</p>
</div>
<div class="err" id="cg-err" style="margin-bottom:10px"></div>
<button class="primary" id="cg-btn" onclick="verifyCode()"><i class="ti ti-arrow-right"></i> Verify access code</button>`}

async function verifyCode(){
  const role=document.getElementById('cg-role').value
  const code=document.getElementById('cg-code').value.trim()
  const err=document.getElementById('cg-err')
  const btn=document.getElementById('cg-btn')
  if(!role){err.textContent='Please select the role you are applying for.';return}
  if(!code){err.textContent='Please enter your access code.';return}
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader"></i> Verifying...'}
  try{
    const res=await fetch('/api/assessments/verify-code',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({code,role})
    })
    const data=await res.json()
    if(data.valid){
      st.codeVerified=true
      st.token=data.token||''
      st.candidateRole=role
      st.phase='consent'
      render()
    }else{
      err.textContent=data.message||'Invalid access code.'
      if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrow-right"></i> Verify access code'}
    }
  }catch(e){
    err.textContent='Verification failed. Please try again.'
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrow-right"></i> Verify access code'}
  }
}

function renderConsent(){return `
<div style="margin-bottom:1.5rem">
  <p style="font-size:11px;font-weight:600;color:var(--teal);letter-spacing:0.1em;margin-bottom:4px">BEFORE YOU BEGIN</p>
  <h2 class="page-title" style="font-size:22px">Assessment terms &amp; conditions</h2>
  <p class="page-sub">Please read carefully. You must accept these terms before proceeding.</p>
</div>

<div class="card" style="border-left:4px solid var(--danger);background:#FFFBFB">
  <p style="font-size:13px;font-weight:600;color:var(--danger);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="ti ti-video"></i> Session recording</p>
  <p style="font-size:13px;color:var(--slate);line-height:1.7;margin-bottom:0">Your camera will be active and your full session will be recorded from the moment you begin until submission. This recording is reviewed by the GoLive hiring team as part of the assessment process. By proceeding you consent to being recorded. You must remain visible on camera at all times during the assessment.</p>
</div>

<div class="card" style="margin-top:0.75rem;border-left:4px solid var(--amber)">
  <p style="font-size:13px;font-weight:600;color:var(--warning);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="ti ti-shield-exclamation"></i> Integrity monitoring: the following are detected and logged</p>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${[
      ['Tab switching','Navigating away from this page or switching to another browser tab will be detected and timestamped. Each instance is logged as a violation.'],
      ['Window focus loss','Clicking outside the assessment window, including switching to another application, is logged.'],
      ['Copy & paste','All paste attempts are blocked. Keyboard shortcuts including Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+F and right-click are disabled.'],
      ['External assistance','The use of AI tools, search engines, reference materials, or assistance from another person is strictly prohibited. This constitutes academic dishonesty and will result in immediate disqualification.'],
      ['One attempt only','You are permitted one attempt at this assessment per role. A second attempt using the same email address will be automatically blocked.'],
    ].map(([t,d])=>`
      <div style="display:flex;gap:10px;align-items:flex-start">
        <i class="ti ti-circle-x" style="color:var(--danger);flex-shrink:0;margin-top:1px"></i>
        <div><p style="font-size:13px;font-weight:500;color:var(--slate);margin-bottom:2px">${t}</p><p style="font-size:12px;color:var(--mid);line-height:1.5">${d}</p></div>
      </div>`).join('')}
  </div>
</div>

<div class="card" style="margin-top:0.75rem;border-left:4px solid var(--teal);background:#FAFFFE">
  <p style="font-size:13px;font-weight:600;color:var(--teal);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="ti ti-info-circle"></i> Assessment details</p>
  <div style="display:flex;flex-direction:column;gap:6px">
    ${[
      ['Duration',(ROLE.minutes||30)+' minutes. The timer starts when you click Begin assessment.'],
      ['Format',(ROLE.count||'')+' questions: multiple choice, true or false, and two short written answers.'],
      ['Device','Laptop or desktop required. Camera must be working before you proceed.'],
      ['Environment','Complete the assessment in a quiet location. Ensure stable internet connection.'],
      ['Results','Your answers and session recording are uploaded securely to GoLive when you submit. The hiring team will contact you with the outcome.'],
    ].map(([t,d])=>`
      <div style="display:flex;gap:10px;align-items:flex-start">
        <i class="ti ti-check" style="color:var(--teal);flex-shrink:0;margin-top:1px"></i>
        <p style="font-size:12px;color:var(--mid);line-height:1.5"><span style="font-weight:500;color:var(--slate)">${t}: </span>${d}</p>
      </div>`).join('')}
  </div>
</div>

<div style="background:var(--gray);border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:0.75rem;margin-bottom:1.25rem">
  <p style="font-size:12px;color:var(--mid);line-height:1.6;text-align:center">By clicking <strong>Accept &amp; Continue</strong> you confirm that you have read and understood these terms, you consent to being recorded, and you agree to complete this assessment independently without any external assistance.</p>
</div>

<div style="display:flex;gap:10px;flex-wrap:wrap">
  <button class="primary" style="flex:1;min-width:160px" onclick="acceptConsent()"><i class="ti ti-check"></i> Accept &amp; continue</button>
  <button style="flex:1;min-width:120px" onclick="st.phase='save-later';render()"><i class="ti ti-bookmark"></i> Save for later</button>
  <button style="flex:1;min-width:100px;border-color:var(--danger);color:var(--danger)" onclick="st.phase='declined';render()"><i class="ti ti-x"></i> Decline</button>
</div>`}

function acceptConsent(){
  st.consentGiven=true
  st.phase='intake'
  render()
}

function renderDeclined(){return `
<div style="text-align:center;padding:2rem 0">
  <div style="width:56px;height:56px;background:var(--danger-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
    <i class="ti ti-x" style="font-size:24px;color:var(--danger)"></i>
  </div>
  <h2 class="page-title">Assessment declined</h2>
  <p class="page-sub" style="max-width:400px;margin:0 auto 1.5rem">You have chosen not to proceed with the assessment. Your application will not be progressed at this time.</p>
  <p style="font-size:13px;color:var(--mid);line-height:1.6;max-width:380px;margin:0 auto 1.5rem">If you change your mind, please contact <a href="mailto:talent.acquisition@golivecompany.com" style="color:var(--teal);text-decoration:none;font-weight:500">talent.acquisition@golivecompany.com</a> and we will advise if the position is still open.</p>
  <button onclick="st.phase='consent';render()"><i class="ti ti-arrow-left"></i> Go back and review</button>
</div>`}

function renderSaveLater(){return `
<div style="text-align:center;padding:2rem 0">
  <div style="width:56px;height:56px;background:var(--accent-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
    <i class="ti ti-bookmark" style="font-size:24px;color:var(--accent)"></i>
  </div>
  <h2 class="page-title">Saved for later</h2>
  <p class="page-sub" style="max-width:420px;margin:0 auto 1.5rem">You can return to complete the assessment when you are ready. Bookmark this page or note down the details below.</p>
  <div class="card" style="text-align:left;max-width:400px;margin:0 auto 1.5rem">
    <p style="font-size:11px;font-weight:600;color:var(--teal);letter-spacing:0.1em;margin-bottom:8px">YOUR ASSESSMENT DETAILS</p>
    <div style="font-size:13px;color:var(--slate);line-height:2">
      <div><span style="color:var(--mid);font-weight:500">Role: </span>${st.candidateRole}</div>
      <div><span style="color:var(--mid);font-weight:500">URL: </span>${window.location.href}</div>
      <div><span style="color:var(--mid);font-weight:500">Your access code: </span><em style="color:var(--muted)">Use the code already provided to you</em></div>
    </div>
  </div>
  <p style="font-size:12px;color:var(--muted);margin-bottom:1.25rem">When you are ready, return to this page, enter your access code, and accept the terms to begin.</p>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
    <button class="primary" onclick="st.phase='consent';render()"><i class="ti ti-arrow-left"></i> Return and accept terms</button>
    <button onclick="window.print()"><i class="ti ti-printer"></i> Print this page</button>
  </div>
</div>`}

function renderIntake(){return `
<div style="text-align:center;padding:1rem 0 0.5rem">
  <h2 class="page-title">${ROLE.heading}</h2>
  <p class="page-sub" style="max-width:420px;margin:0 auto 1.5rem">Please enter your details before beginning. This information will be included in your assessment submission.</p>
</div>
<div class="card">
  <div style="margin-bottom:1rem">
    <label style="display:block;font-size:13px;font-weight:500;color:var(--slate);margin-bottom:5px">Full name <span style="color:var(--danger)">*</span></label>
    <input type="text" id="inp-name" placeholder="Enter your full name" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--slate);background:#fff" oninput="document.getElementById('intake-err').textContent=''">
  </div>
  <div style="margin-bottom:1rem">
    <label style="display:block;font-size:13px;font-weight:500;color:var(--slate);margin-bottom:5px">Email address <span style="color:var(--danger)">*</span></label>
    <input type="email" id="inp-email" placeholder="Enter your email address" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--slate);background:#fff" oninput="document.getElementById('intake-err').textContent=''">
  </div>
  <div style="margin-bottom:0.5rem">
    <label style="display:block;font-size:13px;font-weight:500;color:var(--slate);margin-bottom:5px">Role applying for <span style="color:var(--danger)">*</span></label>
    <div id="inp-role-display" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:'Inter',sans-serif;color:var(--slate);background:var(--gray)">${st.candidateRole}</div>
    <select id="inp-role" style="display:none"><option value="${ROLE.name}" selected>${ROLE.name}</option></select>
  </div>
</div>
<div class="err" id="intake-err" style="margin-bottom:10px"></div>
<button class="primary" id="intake-btn" onclick="submitIntake()"><i class="ti ti-arrow-right"></i> Continue to camera verification</button>`}

async function submitIntake(){
  const name=document.getElementById('inp-name').value.trim()
  const email=document.getElementById('inp-email').value.trim()
  const role=document.getElementById('inp-role').value
  const err=document.getElementById('intake-err')
  const btn=document.getElementById('intake-btn')
  if(!name){err.textContent='Please enter your full name.';return}
  if(!email||!email.includes('@')){err.textContent='Please enter a valid email address.';return}
  if(!role){err.textContent='Please select the role you are applying for.';return}
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader"></i> Registering application...'}
  try{
    const res=await fetch('/api/applications/register',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-assessment-token':st.token||''},
      body:JSON.stringify({name,email,role})
    })
    const data=await res.json()
    if(!data.allowed){
      err.textContent=data.message||'You have already applied for this role. Only one application is permitted.'
      if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrow-right"></i> Continue to camera verification'}
      return
    }
    st.candidateName=name
    st.candidateEmail=email
    st.candidateRole=role
    st.appRef=data.ref
    if(data.token)st.token=data.token
    st.phase='ref-confirm'
    render()
  }catch(e){
    // Previously advanced the candidate anyway, skipping the duplicate check
    // and leaving the submission with no Application record.
    console.error('Registration could not be completed',e)
    err.textContent='We could not register your application. Please check your connection and try again, or contact talent.acquisition@golivecompany.com.'
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-arrow-right"></i> Continue to camera verification'}
  }
}

function renderRefConfirm(){return `
<div style="text-align:center;padding:1rem 0 0.5rem">
  <div style="width:56px;height:56px;background:#E1F5EE;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
    <i class="ti ti-check" style="font-size:24px;color:#0F6E56"></i>
  </div>
  <h2 class="page-title">Application registered</h2>
  <p class="page-sub" style="max-width:420px;margin:0 auto 1.5rem">Your application reference number has been emailed to <strong>${st.candidateEmail}</strong>. Please keep it, as you will need it for all future correspondence.</p>
</div>
<div class="card" style="text-align:center">
  <p style="font-size:11px;font-weight:600;color:var(--teal);letter-spacing:0.1em;margin-bottom:6px">APPLICATION REFERENCE</p>
  <p style="font-size:32px;font-weight:700;color:var(--slate);letter-spacing:0.05em;margin-bottom:4px">${st.appRef}</p>
  <p style="font-size:11px;color:var(--muted)">${st.candidateRole}</p>
</div>
<p style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:1rem">Next step: grant camera access and begin your 30-minute skills assessment.</p>
<button class="primary" onclick="st.phase='gate';render()"><i class="ti ti-camera"></i> Continue to camera verification</button>`}

function renderGate(){return `
<div style="text-align:center;padding:1rem 0 0.5rem">
  <div class="gate-icon"><i class="ti ti-camera"></i></div>
  <h2 class="page-title">Camera access required</h2>
  <p class="page-sub" style="max-width:420px;margin:0 auto 1.5rem">${ROLE.intro} Your camera must remain active throughout. The session will be recorded for review by the hiring team.</p>
</div>
<div class="card">
  <p style="font-size:13px;font-weight:600;color:var(--slate);margin-bottom:10px">Assessment rules</p>
  <ul class="chklist">
    <li><i class="ti ti-camera-check"></i>Camera must stay active for the full ${ROLE.minutes||30} minutes</li>
    <li><i class="ti ti-browser-x"></i>Switching tabs or windows is detected and logged</li>
    <li><i class="ti ti-copy-x"></i>Copy and paste is blocked and flagged</li>
    <li><i class="ti ti-device-mobile-off"></i>No AI tools, search engines, or external help permitted</li>
    <li><i class="ti ti-clock"></i>${ROLE.minutes||30} minutes, submitted automatically when time runs out</li>
    <li><i class="ti ti-download"></i>Session recording available to download at the end</li>
  </ul>
  <div class="info-row">
    <span class="info-pill"><i class="ti ti-list-check"></i>${ROLE.count||''} questions</span>
    <span class="info-pill"><i class="ti ti-clock"></i>${ROLE.minutes||30} minutes</span>
    <span class="info-pill"><i class="ti ti-user"></i>${ROLE.name}</span>
  </div>
</div>
<div class="err" id="cam-err" style="margin-bottom:10px"></div>
<button class="primary" onclick="requestCam()"><i class="ti ti-camera"></i> Grant camera access and continue</button>`}

function renderConfirm(){return `
<div style="text-align:center;padding:1rem 0">
  <video class="preview-vid" id="preview-vid" autoplay muted playsinline></video>
  <div style="margin-bottom:1rem"><span class="badge bs"><i class="ti ti-check"></i> Camera active</span></div>
  <h2 class="page-title">Camera confirmed</h2>
  <p class="page-sub" style="max-width:360px;margin:0 auto 1.5rem;line-height:1.6">Make sure your face is clearly visible. Recording begins when you start. Answer every question as best you can. You have ${ROLE.minutes||30} minutes.</p>
  <div class="err" id="start-err" style="margin-bottom:10px"></div>
  <button class="primary" id="start-btn" onclick="startTest()"><i class="ti ti-player-play"></i> Begin assessment</button>
</div>`}

function renderQuiz(){
  const q=QUESTIONS[st.current]
  const pct=Math.round((st.current/QUESTIONS.length)*100)
  const tc=st.secs<120?'danger':st.secs<300?'warn':''
  const vCount=st.violations.length
  let qHtml=''
  if(q.type==='mcq'){
    qHtml=q.opts.map((o,i)=>`<div class="opt ${st.answers[q.id]===i?'sel':''}" onclick="pick('${q.id}',${i})"><input type="radio" name="${q.id}" ${st.answers[q.id]===i?'checked':''}><span class="opt-text">${o}</span></div>`).join('')
  }else if(q.type==='tf'){
    const a=st.answers[q.id]
    qHtml=`<div class="tf-row"><button class="tf-btn ${a==='True'?'sel':''}" onclick="pickTF('${q.id}','True')">True</button><button class="tf-btn ${a==='False'?'sel':''}" onclick="pickTF('${q.id}','False')">False</button></div>`
  }else{
    qHtml=`<textarea id="ta_${q.id}" placeholder="${q.placeholder||''}" onblur="saveTA('${q.id}')">${st.textAnswers[q.id]||''}</textarea>`
  }
  const warn=st.tabSwitches>0||st.pasteTries>0
  return `
<div class="hbar">
  <div><span class="badge ba">${q.sec}</span><p style="font-size:11px;color:var(--muted);margin-top:5px">Question ${st.current+1} of ${QUESTIONS.length}</p></div>
  <div style="display:flex;gap:8px;align-items:center">
    ${vCount>0?`<span class="badge bd"><i class="ti ti-alert-triangle"></i> ${vCount} flag${vCount!==1?'s':''}</span>`:''}
    <div class="timer-box"><i class="ti ti-clock" style="color:var(--muted);font-size:14px"></i><span class="timer-val ${tc}" id="tmr">${fmt(st.secs)}</span></div>
  </div>
</div>
<div class="warn-banner ${warn?'show':''}" id="wb">
  <i class="ti ti-alert-triangle"></i> ${st.tabSwitches>0?`Tab switch detected (${st.tabSwitches}×).`:''} ${st.pasteTries>0?`Paste blocked (${st.pasteTries}×).`:''} All violations are recorded.
</div>
<div class="prog"><div class="prog-fill" style="width:${pct}%"></div></div>
<p class="q-text">${q.text}</p>
${q.sub?`<p class="q-sub">${q.sub}</p>`:''}
${qHtml}
<div class="err" id="qerr"></div>
<div class="nav">
  <span style="font-size:11px;color:var(--muted)">${st.current+1} / ${QUESTIONS.length}</span>
  <div style="display:flex;gap:8px">
    ${st.current>0?'<button onclick="prev()"><i class="ti ti-arrow-left"></i> Back</button>':''}
    ${st.current<QUESTIONS.length-1?`<button class="primary" onclick="nxt()">Next <i class="ti ti-arrow-right"></i></button>`:`<button class="primary" onclick="finish()">Submit assessment</button>`}
  </div>
</div>`}

function renderResult(){
  // Shown to the candidate. No score and no answers: the result is reviewed
  // by the hiring team, and answers shown here would circulate to later
  // candidates.
  return `
<div style="text-align:center;padding:1rem 0 0.5rem">
  <div class="gate-icon"><i class="ti ti-circle-check"></i></div>
  <h2 class="page-title">Assessment submitted</h2>
  <p class="page-sub" style="max-width:440px;margin:0 auto 1.25rem;line-height:1.6">Thank you, ${st.candidateName}. Your answers for the ${st.candidateRole} assessment have been received. The hiring team will review your result and contact you by email with the next step.</p>
</div>
${st.recBlob&&!st.uploadDone?`<div class="card"><p class="sec-head">Session recording</p><p style="font-size:13px;color:var(--mid);margin-bottom:12px">Your recording is being uploaded automatically. If the upload fails, download it and email it to talent.acquisition@golivecompany.com.</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="primary" id="upload-btn" onclick="uploadRec()"><i class="ti ti-cloud-upload"></i> Upload to server</button><button onclick="downloadRec()"><i class="ti ti-download"></i> Download instead</button></div><p id="upload-status" style="font-size:12px;margin-top:8px"></p></div>`:''}
<p style="font-size:11px;color:var(--muted);text-align:center;margin-top:1.5rem">The GoLive Digital Solutions Company Ltd, RC1644767, talent.acquisition@golivecompany.com</p>`}

function attach(){
  if(st.phase==='confirm'){const v=document.getElementById('preview-vid');if(v&&st.stream)v.srcObject=st.stream}
  if(st.phase==='quiz'){clearInterval(st.timerInterval);st.timerInterval=setInterval(()=>{st.secs--;const d=document.getElementById('tmr');if(d){d.textContent=fmt(st.secs);d.className='timer-val'+(st.secs<120?' danger':st.secs<300?' warn':'')}if(st.secs<=0){clearInterval(st.timerInterval);stopRec();st.phase='uploading';render();waitForBlob()}},1000);injectCam()}
}

function injectCam(){
  if(document.querySelector('.cam-wrap'))return
  const cw=document.createElement('div')
  cw.className='cam-wrap'
  cw.innerHTML=`<div class="cam-box"><video id="live-cam" autoplay muted playsinline></video><div class="cam-rec"></div></div><span class="cam-lbl">Recording in progress</span>`
  document.body.appendChild(cw)
  const lv=document.getElementById('live-cam')
  if(lv&&st.stream)lv.srcObject=st.stream
}

async function requestCam(){
  const err=document.getElementById('cam-err')
  try{
    const s=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false})
    st.stream=s;st.camGranted=true;st.phase='confirm';render()
  }catch(e){if(err)err.textContent='Camera access denied. You must grant camera permission to proceed with this assessment.'}
}

async function startTest(){
  // The server issues the paper and starts the clock. A reload returns the
  // same paper with the time remaining, never a fresh set of questions.
  const btn=document.getElementById('start-btn'),err=document.getElementById('start-err')
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader"></i> Preparing your assessment...'}
  try{
    const res=await fetch('/api/assessments/paper',{method:'POST',headers:{'x-assessment-token':st.token||''}})
    const data=await res.json()
    if(!res.ok||!Array.isArray(data.questions)||!data.questions.length)throw new Error(data.error||'Your assessment could not be prepared. Please try again.')
    QUESTIONS=data.questions
    st.secs=Math.max(1,data.secondsLeft|0)
    st.current=0
  }catch(e){
    if(err)err.textContent=e.message
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-player-play"></i> Begin assessment'}
    return
  }
  st.phase='quiz';startRec();setupAntiCheat();window.onbeforeunload=()=>'Your assessment is in progress.';render()
}

function startRec(){
  if(!st.stream)return
  try{
    const mr=new MediaRecorder(st.stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:250000})
    mr.ondataavailable=e=>{if(e.data&&e.data.size>0)st.chunks.push(e.data)}
    mr.onstop=()=>{st.recBlob=new Blob(st.chunks,{type:'video/webm'})}
    mr.start(1000);st.recorder=mr
  }catch(e){
    try{const mr=new MediaRecorder(st.stream,{videoBitsPerSecond:250000});mr.ondataavailable=e=>{if(e.data&&e.data.size>0)st.chunks.push(e.data)};mr.onstop=()=>{st.recBlob=new Blob(st.chunks,{type:'video/webm'})};mr.start(1000);st.recorder=mr}catch(e2){logV('Recording not supported in this browser')}
  }
}

function stopRec(){
  if(st.recorder&&st.recorder.state!=='inactive')try{st.recorder.stop()}catch(e){}
  if(st.stream)st.stream.getTracks().forEach(t=>t.stop())
  const cw=document.querySelector('.cam-wrap');if(cw)cw.remove()
}

function setupAntiCheat(){
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&st.phase==='quiz'){st.tabSwitches++;logV(`Tab/window hidden (total: ${st.tabSwitches})`);const wb=document.getElementById('wb');if(wb){wb.classList.add('show');wb.innerHTML=`<i class="ti ti-alert-triangle"></i> Tab switch detected (${st.tabSwitches}× flagged). All violations are recorded.`}}})
  window.addEventListener('blur',()=>{if(st.phase==='quiz')logV('Window lost focus')})
  document.addEventListener('paste',e=>{if(st.phase==='quiz'){e.preventDefault();st.pasteTries++;logV(`Paste attempt blocked (total: ${st.pasteTries})`);const wb=document.getElementById('wb');if(wb){wb.classList.add('show');wb.innerHTML=`<i class="ti ti-alert-triangle"></i> Paste blocked (${st.pasteTries}× detected). All violations are recorded.`}}})
  document.addEventListener('contextmenu',e=>{if(st.phase==='quiz')e.preventDefault()})
  document.addEventListener('keydown',e=>{if(st.phase!=='quiz')return;if((e.ctrlKey||e.metaKey)&&['c','v','u','s','a','p','f'].includes(e.key.toLowerCase())){e.preventDefault();if(e.key.toLowerCase()==='v'){st.pasteTries++;logV(`Paste shortcut blocked (total: ${st.pasteTries})`)}else{logV(`Shortcut blocked: Ctrl+${e.key.toUpperCase()}`)}}})
}

function pick(id,i){st.answers[id]=i;render()}
function pickTF(id,v){st.answers[id]=v;render()}
function saveTA(id){const el=document.getElementById('ta_'+id);if(el)st.textAnswers[id]=el.value}

function nxt(){
  const q=QUESTIONS[st.current]
  if(q.type==='text'){const el=document.getElementById('ta_'+q.id);if(el)st.textAnswers[q.id]=el.value}
  const ok=q.type==='text'?(st.textAnswers[q.id]||'').trim().length>0:st.answers[q.id]!==undefined
  if(!ok){const e=document.getElementById('qerr');if(e)e.textContent=q.type==='text'?'Enter a response before continuing.':'Select an answer before continuing.';return}
  st.current++;render()
}

function prev(){
  const q=QUESTIONS[st.current]
  if(q.type==='text'){const el=document.getElementById('ta_'+q.id);if(el)st.textAnswers[q.id]=el.value}
  st.current--;render()
}

function finish(){
  const q=QUESTIONS[st.current]
  if(q.type==='text'){const el=document.getElementById('ta_'+q.id);if(el)st.textAnswers[q.id]=el.value}
  const ok=q.type==='text'?(st.textAnswers[q.id]||'').trim().length>0:st.answers[q.id]!==undefined
  if(!ok){const e=document.getElementById('qerr');if(e)e.textContent=q.type==='text'?'Enter a response before submitting.':'Select an answer before submitting.';return}
  clearInterval(st.timerInterval);stopRec();st.phase='uploading';render();waitForBlob()
}

function buildFD(){
  // Only the choices made. The server marks them against the paper it issued;
  // it ignores any score sent from here, so there is none to send.
  const fd=new FormData()
  fd.append('recording',new File([st.recBlob],'recording.webm',{type:'video/webm'}))
  fd.append('answers',JSON.stringify(st.answers))
  fd.append('textAnswers',JSON.stringify(st.textAnswers))
  fd.append('violations',JSON.stringify(st.violations))
  fd.append('tabSwitches',String(st.tabSwitches))
  fd.append('pasteTries',String(st.pasteTries))
  return fd
}

function waitForBlob(tries){
  tries=tries||0
  if(st.recBlob){uploadGated();return}
  if(tries>20){window.onbeforeunload=null;st.phase='result';render();return}
  setTimeout(()=>waitForBlob(tries+1),300)
}

function renderUploading(){return `
<div style="text-align:center;max-width:420px;margin:3rem auto">
  <p style="font-size:11px;font-weight:600;color:var(--teal);letter-spacing:0.1em;margin-bottom:4px">SUBMISSION IN PROGRESS</p>
  <h2 class="page-title" style="font-size:22px">Uploading your session</h2>
  <p class="page-sub" style="margin:0 auto 1.5rem;line-height:1.6">Do not close this window. Your results will be shown as soon as the upload completes.</p>
  <div style="background:var(--gray);border:1px solid var(--border);border-radius:99px;height:10px;overflow:hidden;margin-bottom:8px"><div id="up-bar" style="height:100%;width:0%;background:var(--teal);transition:width .3s"></div></div>
  <p id="up-pct" style="font-size:12px;color:var(--muted)">Preparing upload…</p>
  <p id="up-err" style="display:none;font-size:12px;color:var(--danger);margin-top:10px"></p>
  <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
    <button class="primary" id="up-retry" style="display:none" onclick="uploadGated()"><i class="ti ti-refresh"></i> Retry upload</button>
    <button id="up-download" style="display:none" onclick="downloadRec()"><i class="ti ti-download"></i> Download recording</button>
  </div>
</div>`}

function uploadGated(){
  const er=document.getElementById('up-err');if(er)er.style.display='none'
  const rb=document.getElementById('up-retry');if(rb)rb.style.display='none'
  const xhr=new XMLHttpRequest()
  xhr.open('POST','/api/save-recording')
  xhr.setRequestHeader('x-assessment-token',st.token||'')
  xhr.upload.onprogress=e=>{if(e.lengthComputable){const p=Math.round(e.loaded/e.total*100);const b=document.getElementById('up-bar');const t=document.getElementById('up-pct');if(b)b.style.width=p+'%';if(t)t.textContent='Uploading, '+p+'%'}}
  xhr.onload=()=>{let ok=false;try{ok=!!JSON.parse(xhr.responseText).success}catch(e){}
    if(xhr.status===200&&ok){st.uploadDone=true;window.onbeforeunload=null;st.phase='result';render()}
    else uploadFail('Server rejected the upload ('+xhr.status+').')}
  xhr.onerror=()=>uploadFail('Connection lost during upload.')
  xhr.send(buildFD())
}

function uploadFail(msg){
  st.upTries=(st.upTries||0)+1
  const e=document.getElementById('up-err');if(e){e.style.display='block';e.textContent=msg+' Your recording is safe in this window. Retry when your connection is stable.'}
  const r=document.getElementById('up-retry');if(r)r.style.display='inline-flex'
  if(st.upTries>=2){const d=document.getElementById('up-download');if(d)d.style.display='inline-flex'}
}

async function uploadRec(){
  if(!st.recBlob)return
  const btn=document.getElementById('upload-btn')
  const status=document.getElementById('upload-status')
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader"></i> Uploading...'}
  try{
    const res=await fetch('/api/save-recording',{method:'POST',headers:{'x-assessment-token':st.token||''},body:buildFD()})
    const data=await res.json()
    if(data.success){
      st.uploadDone=true;window.onbeforeunload=null
      if(status){status.textContent='Recording saved to server successfully.';status.style.color='var(--success)'}
      if(btn){btn.innerHTML='<i class="ti ti-check"></i> Saved to server';btn.style.background='var(--success-bg)';btn.style.color='var(--success)';btn.style.borderColor='#c0dd97'}
    }else{throw new Error(data.error)}
  }catch(e){
    if(status){status.textContent='Upload failed. You can retry, or download the file.';status.style.color='var(--danger)'}
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-refresh"></i> Retry upload'}
  }
}

function downloadRec(){
  if(!st.recBlob)return
  const url=URL.createObjectURL(st.recBlob)
  const a=document.createElement('a')
  a.href=url
  a.download=`GoLive_Assessment_${new Date().toISOString().slice(0,10)}.webm`
  a.click()
  URL.revokeObjectURL(url)
}

render()

