const controller = {};

controller.listChart  = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);

  let userId = req.session.user.id;
  if(req.session.user.role == 'SUPER_ADMIN'){
    userId = 0;
  }

  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM account WHERE (user = ? OR 0 = ?) AND dolDate BETWEEN ? AND ? ORDER BY dolDate DESC', [ userId , userId ,fromDate, toDate],(err, account) => {
     if (err) {
      res.json(err);
     }
     res.render('chart', {
        data: account
     });
    });
  });
}

controller.listExtraHours = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }
  let userId = req.session.user.id;

  let hoursData;
  req.getConnection((err, conn) => {
    conn.query('SELECT MONTHNAME(dol) as mol, '+
               ' (sum(case when code IN (\'PL\') then timeMin else 0 end))/(60*8) as leaveVacation, '+
              ' (sum(case when code IN (\'FIRM_VACATION\') then timeMin else 0 end))/(60*8) as firmVacation, '+
              ' (sum(case when code NOT IN (\'PL\', \'FIRM_VACATION\') then timeMin else 0 end))/60 as actualHours, '+
              ' (sum(timeMin) - (160*60))/60 as extraHours '+
              ' FROM account  '+
              ' where billable = \'on\'  '+
              ' and user = ? '+
              ' group by MONTH(dol), MONTHNAME(dol) '+
              ' order by MONTH(dol)', [ userId ],(err, data) => {
     if (err) {
      res.json(err);
     }
     res.render('hours', {
      hoursData : data
     });
    });
  });

}
controller.list = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);
  let userId = req.session.user.id;

  let projectDetails ;
  req.getConnection((err, conn) => {
    conn.query('SELECT code,displayCode FROM user_projects join projects on projects.id = user_projects.projectId where user_projects.userId = ? order by user_projects.sortBy',[userId],(err, projects) => {
      if (err) {
      res.json(err);
      }
        projectDetails  = projects
    });
  });

  
  if(req.session.user.role == 'SUPER_ADMIN'){
    userId = 0;
  }


  let dataNonBill;
  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM account WHERE (user = ? OR 0 = ?) AND dolDate BETWEEN ? AND ? '
            +' AND billable = \'Off\' AND code NOT IN (\'PL\', \'FIRM_VACATION\') '
            +'  ORDER BY dolDate DESC', [ userId , userId ,fromDate, toDate],(err, data) => {
      if (err) {
        res.json(err);
      }
      dataNonBill = data
    });
  });

  
  let paidLeave = 0;
  req.getConnection((err, conn) => {
    conn.query('SELECT sum(timeMin)/60 as value from account where user = ? and dol < now() and code = \'PL\' ', 
          [ userId],(err, data) => {
      if (err) {
        res.json(err);
      }
      if(data && data.length > 0){
        paidLeave =  data[0].value;
      }
    });
  });

  let leaveBalance = 0;
  req.getConnection((err, conn) => {
    conn.query('SELECT sum(i_balance)*8 as value from leaves where user_id = ? and dom < now() ', 
          [ userId],(err, data) => {
      if (err) {
        res.json(err);
      }
      if(data && data.length > 0){
        leaveBalance =  data[0].value;
      }
    });
  });

  req.getConnection((err, conn) => {
    conn.query('SELECT * FROM account WHERE (user = ? OR 0 = ?) AND dolDate BETWEEN ? AND ? '
            +' AND billable = \'on\' AND code NOT IN (\'PL\', \'FIRM_VACATION\') '
            +'  ORDER BY dolDate DESC', [ userId , userId ,fromDate, toDate],(err, account) => {
     if (err) {
      res.json(err);
     }
     res.render('accounts', {
        dataNonBill : dataNonBill,
        data: account,
        projectData : projectDetails,
        leaveData : ( (leaveBalance - paidLeave) / 8)
     });
    });
  });
};

controller.listExpense = (req, res) => {
  if(!( req.session.user && req.session.user.id && req.session.user.role == 'SUPER_ADMIN')){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);

  let expenseData;
  req.getConnection((err, conn) => {
    conn.query('SELECT code, sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min ' +
                ' FROM account WHERE dolDate BETWEEN ? AND ? AND billable = \'on\' AND code NOT IN (\'PL\', \'FIRM_VACATION\')  '+
                ' group by code', 
    [fromDate, toDate],(err, expenseData) => {
     if (err) {
      res.json(err);
     }

     res.render('expense', {
        expenseData: expenseData,
     });
    });
  });
};


controller.listReport = (req, res) => {
  if(!( req.session.user && req.session.user.id && req.session.user.role == 'SUPER_ADMIN')){
    res.redirect('/');
  }

  var date = new Date();
  var fromDate = new Date(date.getFullYear(), date.getMonth(), 1);
  var toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if(req.query && req.query.fromDate){
    fromDate = new Date(req.query.fromDate);
  } 
  if(req.query && req.query.toDate){
    toDate = new Date(req.query.toDate);
  }

  fromDate.setHours(0,0,0);
  toDate.setHours(0,0,0);

  let userReport, userReportNonBillable , mainDataNoBillable;
  req.getConnection((err, conn) => {
    conn.query('SELECT code, users.username,sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min ' +
               ' FROM account inner join users on account.user = users.id ' +
               ' WHERE dolDate BETWEEN ? AND ? AND billable =  \'on\'  AND code NOT IN (\'PL\', \'FIRM_VACATION\') ' +
               ' group by code, users.username', 
    [fromDate, toDate],(err, reportData) => {if (err) {
      res.json(err);
      }
      userReport  = reportData
    });
  });

  req.getConnection((err, conn) => {
    conn.query('SELECT code, users.username,sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min ' +
               ' FROM account inner join users on account.user = users.id ' +
               ' WHERE dolDate BETWEEN ? AND ? AND billable =  \'Off\'  AND code NOT IN (\'PL\', \'FIRM_VACATION\') ' +
               ' group by code, users.username', 
    [fromDate, toDate],(err, reportData) => {if (err) {
      res.json(err);
      }
      userReportNonBillable  = reportData
    });
  });

  req.getConnection((err, conn) => {
    conn.query('SELECT code, sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min ' +
              ' FROM account WHERE dolDate BETWEEN ? AND ? AND billable = \'Off\'  AND code NOT IN (\'PL\', \'FIRM_VACATION\') '+
              ' group by code', 
    [fromDate, toDate],(err, reportData) => {if (err) {
      res.json(err);
      }
      mainDataNoBillable  = reportData
    });
  });

  req.getConnection((err, conn) => {
    conn.query('SELECT code, sum(timeMin) as totalMin, FLOOR(sum(timeMin)/60) as hours, (sum(timeMin)%60) as min ' +
                ' FROM account WHERE dolDate BETWEEN ? AND ? AND billable = \'on\'  AND code NOT IN (\'PL\', \'FIRM_VACATION\') '+
                ' group by code', 
    [fromDate, toDate],(err, reportData) => {
     if (err) {
      res.json(err);
     }

     res.render('report', {
        billableMain: reportData,
        billableUser : userReport,
        nonBillableMain : mainDataNoBillable,
        nonBillableUser : userReportNonBillable
     });
    });
  });
};

controller.save = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }
  
  const data = req.body;
  var dol= new Date(data.dol);
  dol.setHours(0,0,0);

  data.dolDate = dol;
  var hoursArray = data.hours.split(':');
  data.timeMin = parseInt(hoursArray[0])*60 + parseInt(hoursArray[1]);
  data.user = req.session.user.id;
  
  req.getConnection((err, connection) => {
    const query = connection.query('INSERT INTO account set ?', data, (err, account) => {
      res.redirect('/l/dashboard');
    })
  })
};

controller.edit = (req, res) => {
  const { id } = req.params;
  req.getConnection((err, conn) => {
    conn.query("SELECT * FROM account WHERE id = ?", [id], (err, rows) => {
      res.render('accounts_edit', {
        data: rows[0]
      })
    });
  });
};

controller.update = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  const { id } = req.params;
  const data = req.body;
  var hoursArray = data.hours.split(':');
  data.timeMin = parseInt(hoursArray[0])*60 + parseInt(hoursArray[1]);  

  req.getConnection((err, conn) => {

  conn.query('UPDATE account set ? where id = ?', [data, id], (err, rows) => {
    res.redirect('/');
  });
  });
};

controller.delete = (req, res) => {
  if(!( req.session.user && req.session.user.id)){
    res.redirect('/');
  }

  const { id } = req.params;
  req.getConnection((err, connection) => {
    connection.query('DELETE FROM account WHERE id = ?', [id], (err, rows) => {
      res.redirect('/');
    });
  });
}

module.exports = controller;
