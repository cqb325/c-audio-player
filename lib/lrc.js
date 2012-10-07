/*
*   @author:    huangxu
*   @date:      2008-11
*   @site:  http://wsky.cnblogs.com
*   @descript:  sync display the lyric 
*   @usage:
*               //import lrc.css
*               var lrc=new LRC({lyricTable:obj,lyricWrapper:obj,curRowClassName:'xx',lyric:'xxx',separator:'<BR>'});
*               if(lrc.IsLyricValid()) lrc.DoSync(60);
*
*   @note:  内部变量前缀lrc_,普通变量i,ii,index,arg..
*/

LRC=function(){this.initialize.apply(this,arguments);}
LRC.prototype={
    arrLyricTime:[],
    arrLyric:[],//全局可用，必须执行初始化
    initialize:function(arg){
        //私有
        this.lyricTable=arg.lyricTable;//目标歌词table
        this.lyricWrapper=arg.lyricWrapper;//目标歌词容器div
        this.curRowClassName=arg.curRowClassName;//选择行css样式名
        this.separator=arg.separator;//歌词行分隔符 如：<BR>
        //执行初始化
        this.arrLyricTime=[];
        this.arrLyric=[];
        this.initArray(arg.lyric);
        this.arrLyricTime=this.sort(this.arrLyricTime);
        this.setLyricTable(this.arrLyric);
    },
    initArray:function(lyric){
        var lrc_re=new RegExp('\[[0-9:.]*\]','g');//g全局标志，获取所有匹配结果必须
        var lrc_arr=lyric.split('\n');
        var lrc_temp=0;
        var lrc_filter=0;//无效行过滤标记
        for(var i=0;i<lrc_arr.length;i++){
            var lrc_txt=lrc_arr[i].replace(/\[[\w\W]*\]/g,'').Trim();//add to lyric text array
            if(lrc_txt==''){
                lrc_filter++;
                continue;
            }       
            this.arrLyric[i-lrc_filter]=lrc_txt;
            while((lrc_result = lrc_re.exec(lrc_arr[i])) != null){
                var lrc_second=this.parseSecond(lrc_result.toString().replace(/\[|\]/g,''));
                if(!isNaN(lrc_second))
                    this.arrLyricTime[lrc_temp++]=(i-lrc_filter)+'|'+lrc_second;//arrLyricTime格式为"行号|秒",如：1|50,2|60
            }
        }
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    //  公开函数 
    //  IsLyricValid()判断是否合法lrc歌词    
    //  DoSync()定位歌词
    /////////////////////////////////////////////////////////////////////////////////////////
    IsLyricValid:function(arrLyricTime){
        return this.arrLyricTime.length>0;
    },
    DoSync:function(curPosition){
        var lrc_times=this.arrLyricTime;
        for(var i=0;i<lrc_times.length;i++){
            var lrc_arrPre=lrc_times[i].split('|');
            
            if(i==0&&curPosition<lrc_arrPre[1]) break;//防止抖动
            
            if(lrc_times[i+1]==undefined){
                this.setRow(lrc_arrPre[0]);
                break;
            }
            
            var lrc_arrNext=lrc_times[i+1].split('|');
            if(curPosition>=lrc_arrPre[1]&&curPosition<lrc_arrNext[1]){
                this.setRow(lrc_arrPre[0]);
                break;
            }
        } 
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    //以下为内部辅助函数
    /////////////////////////////////////////////////////////////////////////////////////////
    parseSecond:function(time){
        try{
            var lrc_arr=time.split(':');//time格式为时间格式 00:00
            return parseInt(lrc_arr[0])*60+parseFloat(lrc_arr[1]);
        }catch(ex){
            return 0;
        }
    },
    setLyricTable:function(arrLyric){
        this.lyricWrapper.scrollTop=0;//滚动条置顶
        
        if(this.lyricTable.rows.length>0){ 
            this.clearTable(this.lyricTable);
        }
        for(var i=0;i<arrLyric.length;i++){
            var lrc_tr=this.lyricTable.insertRow(this.lyricTable.rows.length);
            var lrc_cell=lrc_tr.insertCell(0);
            lrc_cell.innerHTML=arrLyric[i];
        }
    },
    clearTable:function(lyricTable){
        var lrc_rowNum=lyricTable.rows.length;
        for (var i=0;i<lrc_rowNum;i++){
            lyricTable.deleteRow(i);
            lrc_rowNum=lrc_rowNum-1;
            i=i-1;
        } 
    },
    setRow:function(index){
        this.setRowClass(index);
        this.setScroll(index);
    },
    setRowClass:function(index){
        var lrc_rows=this.lyricTable.rows;
        for(var i=0;i<lrc_rows.length;i++){
             lrc_rows[i].className='';//TODO:直接添加样式至元素，防止外部css干扰
        }
        lrc_rows[index].className=this.curRowClassName;
    },
    setScroll:function(index){
        this.lyricWrapper.scrollTop=this.lyricTable.rows[index].offsetTop-this.lyricWrapper.offsetHeight/3;
    },
    sort:function(arrLyricTime){
        for(var i=0;i<arrLyricTime.length-1;i++){
            for(var ii=i+1;ii<arrLyricTime.length;ii++){
                var lrc_cur=parseFloat(arrLyricTime[i].split('|')[1]);
                var lrc_next=parseFloat(arrLyricTime[ii].split('|')[1]);
                if(lrc_cur>lrc_next){
                    var lrc_temp=arrLyricTime[i];
                    arrLyricTime[i]=arrLyricTime[ii];
                    arrLyricTime[ii]=lrc_temp;
                }
            }
        }    
        return arrLyricTime;
    }
}


/////////////////////////////////////////////////////////////
//外部函数
/////////////////////////////////////////////////////////////
String.prototype.Trim = function()
{	
    return this.replace(/^\s*|\s*$/g,"");
}
