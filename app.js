const SI_SLABS = [8,10,12,15,20,25,30,35,40,50];

// Get age band lists per category
const AGE_EMP = Object.keys(PREMIUMS.employee);
const AGE_SPOUSE = Object.keys(PREMIUMS.spouse);
const AGE_FAMILY = Object.keys(PREMIUMS.family);
const AGE_PARENTS = Object.keys(PREMIUMS.parents);
const AGE_IND = Object.keys(PREMIUMS.indChildren);

function inr(n){ try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:0}).format(n);}catch(e){return '₹'+Number(n).toFixed(0);} }
function fillSelect(el, arr){ el.innerHTML = arr.map(v=>`<option value="${v}">${v}</option>`).join(''); }
function fillSI(el){ el.innerHTML = SI_SLABS.map(v=>`<option value="${v}">${v} L</option>`).join(''); }

function initControls(){
  // Age bands
  fillSelect(document.getElementById('empAge'), AGE_EMP);
  fillSelect(document.getElementById('spouseAge'), AGE_SPOUSE);
  fillSelect(document.getElementById('child1Age'), AGE_FAMILY);
  fillSelect(document.getElementById('child2Age'), AGE_FAMILY);
  fillSelect(document.getElementById('parent1Age'), AGE_PARENTS);
  fillSelect(document.getElementById('parent2Age'), AGE_PARENTS);
  fillSelect(document.getElementById('parentInLaw1Age'), AGE_PARENTS);
  fillSelect(document.getElementById('parentInLaw2Age'), AGE_PARENTS);
  fillSelect(document.getElementById('indChild1Age'), AGE_IND);
  fillSelect(document.getElementById('indChild2Age'), AGE_IND);
  // SI
  ['empSI','spouseSI','child1SI','child2SI','parent1SI','parent2SI','parentInLaw1SI','parentInLaw2SI','indChild1SI','indChild2SI'].forEach(id=>fillSI(document.getElementById(id)));
  // Defaults
  document.getElementById('empAge').value = 'Upto 35';
  document.getElementById('spouseAge').value = 'Upto 35';
  document.getElementById('child1Age').value = 'Upto 35';
  document.getElementById('child2Age').value = 'Upto 35';
  document.getElementById('parent1Age').value = 'Upto 55';
  document.getElementById('parent2Age').value = 'Upto 55';
  document.getElementById('parentInLaw1Age').value = 'Upto 55';
  document.getElementById('parentInLaw2Age').value = 'Upto 55';
  document.getElementById('indChild1Age').value = 'Upto 35';
  document.getElementById('indChild2Age').value = 'Upto 35';
  document.getElementById('empSI').value = '10';
  document.getElementById('spouseSI').value = '10';
  document.getElementById('child1SI').value = '10';
  document.getElementById('child2SI').value = '10';
  document.getElementById('parent1SI').value = '10';
  document.getElementById('parent2SI').value = '10';
  document.getElementById('parentInLaw1SI').value = '10';
  document.getElementById('parentInLaw2SI').value = '10';
  document.getElementById('indChild1SI').value = '10';
  document.getElementById('indChild2SI').value = '10';

  // Entitlement chip on pay band change
  const payBand = document.getElementById('payBand');
  const entBox = document.getElementById('entitlementBox');
  function updateEntChip(){ entBox.textContent = 'Entitlement: ₹' + payBand.value + 'L'; }
  payBand.addEventListener('change', updateEntChip);
  updateEntChip();
}

function chosenPremium(category, ageBand, si){
  return PREMIUMS[category]?.[ageBand]?.[si];
}

function computeSubsidized(category, ageBand, chosenSI, entitlementSI, gstPct){
  const chosenBase = chosenPremium(category, ageBand, chosenSI);
  const eligibleBase = chosenPremium(category, ageBand, entitlementSI);
  if(chosenBase==null || eligibleBase==null){
    return { error: `Missing rate for ${category} — ${ageBand}, SI ₹${chosenSI}L or entitlement ₹${entitlementSI}L` };
  }
  let employerShare=0, employeeShare=0;
  if(chosenSI <= entitlementSI){
    employerShare = 0.75 * chosenBase;
    employeeShare = 0.25 * chosenBase;
  } else {
    employerShare = 0.75 * eligibleBase;
    employeeShare = 0.25 * eligibleBase + (chosenBase - eligibleBase);
  }
  const gst = employeeShare * (gstPct/100);
  return { base: chosenBase, employerShare, employeeShare, gst, total: employeeShare + gst };
}

function computeSelfPaid(category, ageBand, chosenSI, gstPct){
  const base = chosenPremium(category, ageBand, chosenSI);
  if(base==null){
    return { error: `Missing rate for ${category} — ${ageBand}, SI ₹${chosenSI}L` };
  }
  const employerShare = 0;
  const employeeShare = base;
  const gst = employeeShare * (gstPct/100);
  return { base, employerShare, employeeShare, gst, total: employeeShare + gst };
}

function calculate(){
  const entitlementSI = Number(document.getElementById('payBand').value);
  const gstPct = Number(document.getElementById('gstPct').value);
  const resultsBody = document.getElementById('resultsBody');
  resultsBody.innerHTML = '';

  const rows = [];
  let monthlySubsidized = 0, monthlyGrand = 0;

  function addPersonRow(label, onId, ageId, siId, category, subsidized){
    if(!document.getElementById(onId).checked) return;
    const age = document.getElementById(ageId).value;
    const si = Number(document.getElementById(siId).value);
    const res = subsidized
      ? computeSubsidized(category, age, si, entitlementSI, gstPct)
      : computeSelfPaid(category, age, si, gstPct);
    if(res.error){
      rows.push(`<tr><td colspan="6" style="color:#b91c1c">${res.error}</td></tr>`);
      return;
    }
    if(subsidized){ monthlySubsidized += res.total/12; }
    monthlyGrand += res.total/12;
    rows.push(`<tr>
      <td data-label="Person">${label}</td>
      <td data-label="Base Premium">${inr(res.base)}</td>
      <td data-label="Employer Share">${inr(res.employerShare)}</td>
      <td data-label="Employee Share">${inr(res.employeeShare)}</td>
      <td data-label="GST">${inr(res.gst)}</td>
      <td data-label="Total"><b>${inr(res.total)}</b></td>
    </tr>`);
  }

  // Employer-subsidized
  addPersonRow('Employee','empOn','empAge','empSI','employee',true);
  addPersonRow('Spouse','spouseOn','spouseAge','spouseSI','spouse',true);
  addPersonRow('Dependent Child 1','child1On','child1Age','child1SI','family',true);
  addPersonRow('Dependent Child 2','child2On','child2Age','child2SI','family',true);
  // Self-paid
  addPersonRow('Parent 1','parent1On','parent1Age','parent1SI','parents',false);
  addPersonRow('Parent 2','parent2On','parent2Age','parent2SI','parents',false);
  addPersonRow('Parent-in-law 1','parentInLaw1On','parentInLaw1Age','parentInLaw1SI','parents',false);
  addPersonRow('Parent-in-law 2','parentInLaw2On','parentInLaw2Age','parentInLaw2SI','parents',false);
  addPersonRow('Independent Child 1','indChild1On','indChild1Age','indChild1SI','indChildren',false);
  addPersonRow('Independent Child 2','indChild2On','indChild2Age','indChild2SI','indChildren',false);

  if(rows.length===0){
    resultsBody.innerHTML = '<tr><td colspan="6" class="muted">Select members and click <b>Calculate</b>.</td></tr>';
  }else{
    resultsBody.innerHTML = rows.join('');
  }

  document.getElementById('monthlySubsidized').textContent = 'Monthly (Employee share for subsidized members): ' + inr(Math.round(monthlySubsidized*100)/100);
  document.getElementById('monthlyGrand').textContent = 'Monthly (Total incl. GST): ' + inr(Math.round(monthlyGrand*100)/100);
}

function resetAll(){
  document.getElementById('payBand').value = '8';
  document.getElementById('gstPct').value = '18';
  // defaults for checkboxes
  ['empOn','spouseOn','child1On','child2On','parent1On','parent2On','parentInLaw1On','parentInLaw2On','indChild1On','indChild2On'].forEach((id)=>{
    document.getElementById(id).checked = (id==='empOn');
  });
  // refill selects
  initControls();
  document.getElementById('resultsBody').innerHTML = '<tr><td colspan="6" class="muted">Select members and click <b>Calculate</b>.</td></tr>';
  document.getElementById('monthlySubsidized').textContent = 'Monthly (Employee share for subsidized members): —';
  document.getElementById('monthlyGrand').textContent = 'Monthly (Total incl. GST): —';
}

function init(){
  initControls();
  document.getElementById('calcBtn').addEventListener('click', calculate);
  document.getElementById('resetBtn').addEventListener('click', resetAll);
}
document.addEventListener('DOMContentLoaded', init);