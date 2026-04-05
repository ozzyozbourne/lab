#let resume(
  author: "",              author-position: left,       personal-info-position: left, pronouns: "",           location: "",            
  email: "",               github: "",                  linkedin: "",                 phone: "",              personal-site: "", 
  accent-color: "#000000", font: "New Computer Modern", paper: "us-letter",           author-font-size: 20pt, 
  font-size: 10pt,         lang: "en",                  body
) = {

  set document(author: author, title: author)
  set text(font: font, size: font-size, lang: lang, ligatures: false)
  set page(margin: (0.5in), paper: paper)

  show link: underline
  show heading.where(level: 2): it => [
    #pad(top: 0pt, bottom: -10pt, [#smallcaps(it.body)])
    #line(length: 100%, stroke: 1pt)
  ]

  show heading: set text(fill: rgb(accent-color))
  show link: set text(fill: rgb(accent-color))

  show heading.where(level: 1): it => [
    #set align(author-position)
    #set text(weight: 700, size: author-font-size)
    #pad(it.body)
  ]

  [= #(author)]

  let contact-item(value, link-type: "") = {
    if value != "" {
      if link-type != "" { link(link-type + value)[#value] } 
      else { value }
    }
  }

  pad(
    top: 0.25em,
    align(personal-info-position)[
      #{
        let items = (
          contact-item(pronouns),                             contact-item(phone, link-type: "tel:"), 
          contact-item(location),                             contact-item(email, link-type: "mailto:"),    
          contact-item(github, link-type: "https://"),        contact-item(linkedin, link-type: "https://"), 
          contact-item(personal-site, link-type: "https://")
        )
        items.filter(x => x != none).join("  |  ")
      }
    ]
  )

  set par(justify: true)
  body
}

#let generic-two-by-two(top-left: "", top-right: "", bottom-left: "", bottom-right: "" ) = {
  [
    #top-left #h(1fr) #top-right \
    #bottom-left #h(1fr) #bottom-right
  ]
}

#let generic-one-by-two(left: "", right: "") = { [ #left #h(1fr) #right ] }

// Cannot just use normal --- ligature because ligatures are disabled for good reasons
#let dates-helper(start-date: "", end-date: "") = {
  if start-date == "" { end-date } 
  else { start-date + " " + sym.dash.em + " " + end-date }
}

#let edu(institution: "", dates: "", degree: "", gpa: "", location: "") = {
  if gpa == "" { 
    generic-two-by-two(top-left: strong(institution), top-right: location, bottom-left: emph(degree), bottom-right: emph(dates))
  } else {
    generic-two-by-two(top-left: strong(institution), top-right: location, bottom-left: emph(degree), bottom-right: emph(dates))
  }
}

#let work(title: "", dates: "", company: "", location: "") = {
  generic-two-by-two(top-left: strong(title), top-right: dates, bottom-left: company, bottom-right: emph(location))
}

#let project(role: "", name: "", url: "", dates: "") = {
  generic-one-by-two(
    left: {
      if role == "" { [*#name* #if url != "" and dates != "" [ (#link("https://" + url)[#url])]] } 
      else { [*#role*, #name #if url != "" and dates != ""  [ (#link("https://" + url)[#url])]] }
    },
    right: {
      if dates == "" and url != "" { link("https://" + url)[#url] } 
      else { dates }
    }
  )
}
