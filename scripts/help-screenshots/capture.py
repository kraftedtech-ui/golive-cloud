import json, sys
sys.path.insert(0, __import__('os').path.dirname(__file__)); from mocks import MOCKS
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
OUT=__import__('os').path.join(__import__('os').path.dirname(__file__), '..', '..', 'public', 'help') + '/'
now='2026-09-26T09:00:00Z'
P={"_id":"a1","ref":"GL-PTR-APP-2026-0002","status":"screening","category":"sales","applicant":{"name":"Femi Emmanuel","email":"femi@example.com","phone":"0803","city":"Lagos","applyingAs":"individual"},"namedAccounts":[{"_id":"n1","organisation":"Ikoyi Medical Centre","sector":"Healthcare","decision":"pending"}],"declarations":{},"createdAt":now}
PD=dict(P); PD.update({"background":{"referees":[]},"solutions":["Microsoft 365"],"engagement":{},"acknowledgements":{},"signature":{"name":"Femi Emmanuel","signedAt":now},"timeline":[{"at":now,"by":"system","action":"Application submitted"}],"attempts":[]})
DEAL={"_id":"d1","ref":"GL-DR-2026-0003","partnerNumber":"GL-PTR-001","partnerName":"Femi Emmanuel","partnerEmail":"femi@example.com","category":"sales","source":"portal","organisation":"Seplat Energy","sector":"Energy","contactName":"Kunle Ade","lineOfBusiness":"Microsoft 365 and cloud subscriptions","requirement":"Microsoft 365 for 120 staff","status":"active","submittedAt":now,"approvedAt":now,"approvedBy":"adeniyi.olayemi@golivecompany.com","scheduleVersion":1,"validUntil":"2026-12-25","hardLimit":"2027-03-25","milestones":[],"timeline":[{"at":now,"by":"adeniyi.olayemi@golivecompany.com","action":"Approved. Schedule version 1 locked"}]}
M=dict(MOCKS)
M['/api/partners']={"applications":[P]}
M['/api/partners/a1']={"application":PD,"training":None,"agreementMode":{"allowed":True,"test":False},"currentScheduleVersion":1}
M['/api/partner-deals']={"deals":[DEAL]}
def handler(route):
    path=route.request.url.split('3100')[1].split('?')[0]
    route.fulfill(status=200, content_type='application/json', body=json.dumps(M.get(path, {})))
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: font=ImageFont.load_default()
def save(pg, name, marks=(), full=False, clip=None):
    boxes=[]
    for m in marks:
        try:
            if m.startswith('css='): loc=pg.locator(m[4:]).first
            else:
                loc=pg.get_by_text(m, exact=True).first
                if loc.count()==0: loc=pg.get_by_text(m).first
            bb=loc.bounding_box(timeout=3000)
            if bb: boxes.append(bb)
            else: print('  no box:', name, m)
        except Exception as e: print('  miss:', name, m)
    path='/tmp/help-raw.png'; pg.screenshot(path=path, full_page=full)
    im=Image.open(path).convert('RGB'); d=ImageDraw.Draw(im)
    for i,bb in enumerate(boxes,1):
        x0,y0,x1,y1=bb['x']-5,bb['y']-4,bb['x']+bb['width']+5,bb['y']+bb['height']+4
        for k in range(3): d.rounded_rectangle((x0-k,y0-k,x1+k,y1+k), radius=6, outline=(0,165,168))
        cx,cy=x0-2,y0-2; d.ellipse((cx-12,cy-12,cx+12,cy+12), fill=(0,165,168)); d.text((cx-4.5,cy-9),str(i),fill='white',font=font)
    if clip: im=im.crop(clip)
    w=1200; im=im.resize((w,int(im.height*w/im.width)), Image.LANCZOS)
    im.save(OUT+name+'.jpg', quality=82, optimize=True); print('saved', name, len(boxes),'marks')
with sync_playwright() as p:
    b=p.chromium.launch()
    # signed out: login
    ctx=b.new_context(viewport={'width':1366,'height':860}); pg=ctx.new_page(); pg.set_default_timeout(15000)
    pg.goto('http://localhost:3100/portal/login', wait_until='domcontentloaded'); pg.wait_for_timeout(1500)
    save(pg,'signin',['css=input[type=email]','css=input[type=password]','css=button[type=submit]']); ctx.close()
    def ctx_for(role):
        c=b.new_context(viewport={'width':1366,'height':860})
        c.add_cookies([{'name':'next-auth.session-token','value':open(__import__('os').path.join(__import__('os').path.dirname(__file__), f'tok_{role}')).read().strip(),'domain':'localhost','path':'/'}])
        pg=c.new_page(); pg.set_default_timeout(15000)
        pg.route('**/api/**', lambda r: r.continue_() if '/api/auth/' in r.request.url else handler(r)); return c,pg
    def go(pg,key,wait=2200): pg.goto(f'http://localhost:3100/portal#{key}', wait_until='domcontentloaded'); pg.wait_for_timeout(wait)
    c,pg=ctx_for('admin')
    go(pg,'dashboard'); save(pg,'tour',['css=input[placeholder*="Search"]','New lead','css=button[aria-label*="otification"]'])
    try:
        pg.get_by_role('button', name='New lead').first.click(); pg.wait_for_timeout(1200); save(pg,'new-lead',['Company name *','Save Lead'])
        pg.get_by_role('button', name='Cancel').first.click(); pg.wait_for_timeout(500)
    except Exception as e: print('  new-lead failed', str(e)[:80])
    go(pg,'pipeline'); save(pg,'pipeline',['New Lead','Assessment Done','Quote Sent','Negotiating','Won'])
    go(pg,'discovery'); save(pg,'discovery',['css=select'])
    go(pg,'proposals'); save(pg,'proposals',['Select Lead','Package','Billing Plan'], full=True)
    go(pg,'customers'); save(pg,'customers',['Agreement'])
    go(pg,'transfers'); save(pg,'transfers',['Status'])
    go(pg,'onboarding'); save(pg,'deployment',['css=select'])
    go(pg,'payment-risk'); save(pg,'payment-risk',['Mark paid'])
    go(pg,'commissions'); save(pg,'commissions',["Do's & Don'ts",'Forecast Calculator','Commission Tracker'])
    go(pg,'announcements'); save(pg,'announcements',[])
    go(pg,'knowledge'); save(pg,'knowledge',['New Article','css=input[placeholder*="Search articles"]'])
    go(pg,'team'); save(pg,'team',['Add Team Member','Edit'])
    pg.goto('http://localhost:3100/portal/partners', wait_until='domcontentloaded'); pg.wait_for_timeout(2000)
    try: pg.get_by_text('Femi Emmanuel', exact=True).first.click(); pg.wait_for_timeout(1500)
    except Exception: print('  no applicant row')
    save(pg,'partner-application',['Accreditation stage'], full=True)
    pg.goto('http://localhost:3100/portal/partners/deals', wait_until='domcontentloaded'); pg.wait_for_timeout(2000)
    try: pg.get_by_text('Seplat Energy', exact=True).first.click(); pg.wait_for_timeout(1200)
    except Exception: print('  no deal row')
    save(pg,'deal-registration',['Record a milestone GoLive confirms'], full=True)
    c.close()
    for role in ['operations','support']:
        c,pg=ctx_for(role); go(pg,'dashboard'); save(pg,f'menu-{role}',[]); c.close()
    c,pg=ctx_for('sales'); go(pg,'dashboard'); save(pg,'menu-sales',[]); c.close()
    b.close()
