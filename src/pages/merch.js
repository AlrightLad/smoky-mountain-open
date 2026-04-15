/* ================================================
   PAGE: MERCH
   ================================================ */
Router.register("merch", function() {
  var h = '<div class="sh"><h2>Merch</h2><button class="back" onclick="Router.back(\'home\')">← Back</button></div>';

  h += '<div style="text-align:center;padding:20px 16px"><div style="width:60px;height:60px;border-radius:14px;margin:0 auto 12px;overflow:hidden"><img alt="" src="watermark.jpg" style="width:100%;height:100%;object-fit:cover"></div>';
  h += '<div style="font-family:Playfair Display,serif;font-size:18px;color:var(--gold)">Parbaughs Collection</div>';
  h += '<div style="font-size:11px;color:var(--muted);margin-top:4px;letter-spacing:.3px">Rep the crew on and off the course</div></div>';

  var items = [
    {name:"Parbaughs Performance Polo",desc:"Moisture-wicking, 4-way stretch. Navy with gold crest.",status:"Coming soon"},
    {name:"Parbaughs Bucket Hat",desc:"The signature look. Structured fit, embroidered logo.",status:"Coming soon"},
    {name:"Parbaughs Headcover Set",desc:"Driver, fairway, hybrid. Premium leather with gold stamp.",status:"Coming soon"},
    {name:"Parbaughs Divot Tool & Marker",desc:"Brass finish divot tool with custom ball marker.",status:"Coming soon"},
    {name:"Parbaughs Golf Towel",desc:"Waffle weave microfiber. Navy with gold embroidery.",status:"Coming soon"},
    {name:"Parbaughs Yeti Tumbler",desc:"20oz insulated. Matte navy with gold crest.",status:"Coming soon"}
  ];

  items.forEach(function(item) {
    h += '<div class="card"><div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">';
    h += '<div><div style="font-size:14px;font-weight:600">' + item.name + '</div>';
    h += '<div style="font-size:11px;color:var(--muted);margin-top:2px;line-height:1.4">' + item.desc + '</div></div>';
    h += '<div style="font-size:10px;padding:4px 10px;border:1px solid var(--border);border-radius:12px;color:var(--muted);white-space:nowrap">' + item.status + '</div>';
    h += '</div></div>';
  });

  h += '<div style="padding:16px;text-align:center;font-size:11px;color:var(--muted)">Interested? Let The Commissioner know.</div>';

  document.querySelector('[data-page="merch"]').innerHTML = h;
});

