using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AngularGrid.Models
{
    public class GridDataModel
    {
        public int id { get; set; }
        public string name { get; set; }
        public int age { get; set; }
        public string gender { get; set; }
        public string email { get; set; }
    }

    public class GridFilter
    {
        public string column { get; set; }
        public string value { get; set; }
        public string opt { get; set; }
    }
}