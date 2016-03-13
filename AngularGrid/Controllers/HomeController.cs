using AngularGrid.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;

namespace AngularGrid.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [OutputCache(NoStore = true, Duration = 0)]
        public JsonResult GetItems(int page, int size, List<GridFilter> filters)
        {
            using (StreamReader r = new StreamReader(@"C:\Users\pankaj\documents\visual studio 2013\Projects\AngularGrid\AngularGrid\500_complex.json"))
            {
                string json = r.ReadToEnd();
                List<GridDataModel> rawData = Newtonsoft.Json.JsonConvert.DeserializeObject<List<GridDataModel>>(json).ToList();
                var dashboardData = rawData.AsQueryable();
                var query = (new List<GridDataModel>()).AsQueryable();


                if (filters != null)
                {
                    foreach (var item in filters)
                    {
                        switch (item.column)
                        {
                            case "name":
                                var t = dashboardData.Where(p => p.name.ToString().ToLower().Contains(item.value.ToLower()));
                                query = query.Concat<GridDataModel>(t);
                                break;

                            case "age":
                                t = dashboardData.Where(p => p.age.ToString().Equals(item.value));
                                query = query.Concat<GridDataModel>(t);
                                break;
                        }


                    }
                    rawData = query.ToList();
                }


                int skip = (page - 1) * size;
                var data = rawData.Skip(skip).Take(size).ToList();

                var jsonData = new { data = data, totalCount = rawData.Count, pageSize = data.Count };
                return Json(jsonData, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpGet]
        public JsonResult GetEmailIds()
        {
            var items = new[] { 
            new {Text="pankaj",Value="1",Selected=true },
            new {Text="dhami",Value="1",Selected=false }
            };

            return Json(items, JsonRequestBehavior.AllowGet);
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}