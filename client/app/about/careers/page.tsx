import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function CareersPage() {
  const departments = [
    "All Departments",
    "Engineering",
    "Product",
    "Marketing",
    "Sales",
    "Customer Success",
    "Finance",
    "HR",
    "Legal",
  ]

  const locations = ["All Locations", "New York", "San Francisco", "Tel Aviv", "Berlin", "London", "Remote"]

  const jobOpenings = [
    {
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "New York",
      type: "Full-time",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "San Francisco",
      type: "Full-time",
    },
    {
      title: "Marketing Specialist",
      department: "Marketing",
      location: "Tel Aviv",
      type: "Full-time",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Berlin",
      type: "Full-time",
    },
    {
      title: "Data Scientist",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "UX Designer",
      department: "Product",
      location: "London",
      type: "Full-time",
    },
    {
      title: "Sales Development Representative",
      department: "Sales",
      location: "New York",
      type: "Full-time",
    },
    {
      title: "HR Business Partner",
      department: "HR",
      location: "Tel Aviv",
      type: "Full-time",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="mb-8 sm:mb-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Join Our Team</h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8">
          Help us change how the world works together. Explore opportunities to grow your career at JobNOVA.
        </p>
        <div className="relative max-w-xl mx-auto px-4 sm:px-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search for jobs..." className="pl-10 h-12" />
        </div>
      </section>

      {/* Why JobNOVA Section */}
      <section className="mb-8 sm:mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
        <div className="rounded-lg overflow-hidden">
          <img
            src="/banner/banner-career.jpg?height=400&width=600"
            alt="JobNOVA office culture"
            className="w-full h-auto object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">Why Work at JobNOVA?</h2>
          <p className="text-lg mb-6">
            At JobNOVA, we're building a platform that changes how the world works together. Our team is made up of
            creative, collaborative, and dedicated people who share a common goal: to create opportunities for anyone in
            the world to build their business, brand, or dreams.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Innovation</h3>
              <p>We're constantly pushing boundaries</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Growth</h3>
              <p>Opportunities to learn and develop</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Impact</h3>
              <p>Your work affects millions globally</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Culture</h3>
              <p>Diverse, inclusive, and supportive</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-16 bg-muted rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Benefits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Health & Wellness",
              items: ["Comprehensive health insurance", "Mental health support", "Wellness programs", "Gym membership"],
            },
            {
              title: "Work-Life Balance",
              items: ["Flexible working hours", "Remote work options", "Generous PTO", "Parental leave"],
            },
            {
              title: "Growth & Development",
              items: ["Learning stipend", "Career development", "Mentorship programs", "Conference budget"],
            },
          ].map((benefit, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item, idx) => (
                    <li key={idx} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Open Positions</h2>

        <Tabs defaultValue="All Departments" className="mb-8">
          <TabsList className="flex flex-wrap h-auto mb-6">
            {departments.map((dept, index) => (
              <TabsTrigger key={index} value={dept} className="mb-2">
                {dept}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-wrap gap-2 mb-6">
            {locations.map((location, index) => (
              <Button key={index} variant={index === 0 ? "default" : "outline"} size="sm">
                {location}
              </Button>
            ))}
          </div>

          {departments.map((dept) => (
            <TabsContent key={dept} value={dept} className="mt-0">
              <div className="space-y-4">
                {jobOpenings
                  .filter((job) => dept === "All Departments" || job.department === dept)
                  .map((job, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>{job.department}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{job.type}</span>
                            </div>
                          </div>
                          <Button className="mt-4 md:mt-0" asChild>
                            <Link href={`/about/careers/${job.title.toLowerCase().replace(/\s+/g, "-")}`}>
                              Apply Now
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Employee Testimonials */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Life at JobNOVA</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Bành Tuấn Kiệt",
              role: "Senior Product Manager",
              image: "/avatar/kiet.jpg?height=300&width=300",
              quote:
                "Working at JobNOVA has been the most rewarding experience of my career. The culture of innovation and the impact we make on freelancers' lives is incredible.",
            },
            {
              name: "Trần Quốc Anh",
              role: "Software Engineer",
              image: "/avatar/avt2.jpg?height=300&width=300",
              quote:
                "I love the technical challenges we solve at JobNOVA. We're constantly pushing the boundaries of what's possible while maintaining a healthy work-life balance.",
            },
            {
              name: "Nguyễn Nguyễn Thái Bảo",
              role: "Customer Success Lead",
              image: "/avatar/avt3.jpg?height=300&width=300",
              quote:
                "The diversity of thought and inclusive environment at JobNOVA makes it a special place to work. I've grown both professionally and personally here.",
            },
          ].map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                    <img
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="italic">"{testimonial.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary text-primary-foreground rounded-xl p-12">
        <h2 className="text-3xl font-bold mb-4">Don't See the Right Fit?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          We're always looking for talented individuals to join our team. Send us your resume and we'll keep you in mind
          for future opportunities.
        </p>
        <Button variant="secondary" size="lg" asChild>
          <Link href="/about/careers/general-application">Submit General Application</Link>
        </Button>
      </section>
    </div>
  )
}
