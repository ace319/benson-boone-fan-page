(async()=>{
  const [base,recent,mapBase]=await Promise.all([
    fetch('assets/benson-geography-stats.json').then(response=>response.json()),
    fetch('assets/benson-2026-location-updates.json').then(response=>response.json()),
    fetch('assets/benson-played-locations.json').then(response=>response.json())
  ]);

  const data=JSON.parse(JSON.stringify(base));
  const unitedStates=data.countries.find(country=>country.name==='United States');
  recent.shows.forEach(show=>{
    let city=unitedStates.cities.find(item=>item.name===show.city);
    if(!city){city={name:show.city,plays:0,shows:[]};unitedStates.cities.push(city)}
    if(!city.shows.some(item=>item.dateSort===show.dateSort&&item.venue===show.venue)){
      city.shows.push({date:show.date,dateSort:show.dateSort,venue:show.venue,event:show.event,tour:show.tour,source:show.source});
      city.shows.sort((a,b)=>a.dateSort.localeCompare(b.dateSort));
      city.plays+=1;
      unitedStates.plays+=1;
      data.performanceCount+=1;
    }
  });
  unitedStates.cities.sort((a,b)=>a.name.localeCompare(b.name));
  unitedStates.cityCount=unitedStates.cities.length;
  data.cityCount=data.countries.reduce((total,country)=>total+country.cities.length,0);

  const showRow=(show,cityName)=>{
    const row=document.createElement('li');
    const date=document.createElement('time');date.textContent=show.date;
    const info=document.createElement('span');
    const title=document.createElement('strong');title.textContent=cityName||show.venue;
    const note=document.createElement('small');note.textContent=cityName?show.venue:[show.event,show.tour].filter(Boolean).join(' · ');
    info.append(title,note);row.append(date,info);return row
  };
  const countryStats=document.querySelector('#country-stats');
  if(countryStats){
    const countries=[...data.countries].sort((a,b)=>b.plays-a.plays||a.name.localeCompare(b.name));
    countryStats.replaceChildren(...countries.map((country,countryIndex)=>{
      const item=document.createElement('li');item.className='country-stat-item';
      const details=document.createElement('details');const summary=document.createElement('summary');
      summary.innerHTML=`<span>${String(countryIndex+1).padStart(2,'0')}</span><strong>${country.name}<small>${country.cityCount} ${country.cityCount===1?'city':'cities'}</small></strong><b>${country.plays}<small>${country.plays===1?' show':' shows'}</small></b>`;
      const cities=document.createElement('ol');cities.className='country-city-list';
      cities.replaceChildren(...country.cities.map((city,cityIndex)=>{
        const row=document.createElement('li');row.className='country-city-item';
        const cityDetails=document.createElement('details');const citySummary=document.createElement('summary');
        citySummary.innerHTML=`<span>${String(cityIndex+1).padStart(2,'0')}</span><strong>${city.name}</strong><b>${city.plays}<small>${city.plays===1?' show':' shows'}</small></b>`;
        const shows=document.createElement('ul');shows.className='city-venue-list';shows.replaceChildren(...city.shows.map(show=>showRow(show)));
        cityDetails.append(citySummary,shows);row.append(cityDetails);return row
      }));
      details.append(summary,cities);item.append(details);return item
    }))
  }

  const wanted=data.countries.flatMap(country=>country.cities.flatMap(city=>city.shows.filter(show=>show.tour==='Wanted Man Tour').map(show=>({...show,city:city.name})))).sort((a,b)=>a.dateSort.localeCompare(b.dateSort));
  const wantedContainer=document.querySelector('#wanted-played-location-list');
  if(wantedContainer){const list=document.createElement('ul');list.className='city-venue-list wanted-played-list';list.replaceChildren(...wanted.map(show=>showRow(show,show.city)));wantedContainer.replaceChildren(list)}
  const wantedLabel=document.querySelector('.wanted-played-locations>summary strong');if(wantedLabel)wantedLabel.textContent=`${wanted.length} shows played so far`;
  const summary=document.querySelector('#geography-summary');if(summary)summary.textContent=`${data.performanceCount} reported performances · ${data.cityCount} cities · ${data.countryCount} countries`;

  const locations=[...mapBase.locations.map(location=>({...location}))];
  recent.shows.forEach(show=>{const existing=locations.find(location=>location.name===show.mapName);if(existing)existing.count+=1;else locations.push({name:show.mapName,lat:show.lat,lon:show.lon,count:1,matched:show.mapName})});
  cities=locations.map(location=>[location.lon,location.lat,'played',location.name,location.count]);
  const mapCount=document.querySelector('#globe-performance-count');if(mapCount)mapCount.textContent=`${data.performanceCount} reported performances · ${locations.length} locations · 2021–2026`;
  drawWorldMap();
})().catch(()=>{});
