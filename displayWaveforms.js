        //***************************************************************************
        // Registers
        //***************************************************************************

        var FS = 1000;                      // Sampling frequency 1000Hz
        var Sweep = FS * 5;                 // X axis length of the window (5000: 5s)
        var Vnew = [15];
        var xPoint = 0;

        var yMax = [15], yMin = [15];	    // Maximum and minimum data for undisplyed period
        var Voffset = [15];
        var PenSize = 1;
        var ox = 1000, oy = 300;
        var stdW = 50;
        var Xpoint = stdW;
        var WaveSteps = stdW;
        var WaveStepsPerDot;	            // Number of count up step per sample
        var BufSize = 1000;		            // 1s data
        var NowPoint = 0;
        var dSpeed = 1.0;
        var shiftWidth, shiftIndex;         // Waveform shift step
        var initDisplay = 1;                // Initialize display  1: On,   0: Off
        var displayResolution = 1;
		var instTimer = 0;
		var gain = 1.0;
		var patient = 0
		var DataCount = 200;               // Data length in ms on one packet   200ms
        var calTimer = 0;                  // Cal timer(200-161ms=0, 160-41ms=205, 40-1ms=0)

        var m_workDC;
        var cvs;                           // Canvas



        //***************************************************************************
        // Display waveforms
        //***************************************************************************
        function displayWaveforms(data) {

            for (let m = 0; m < DataCount; ++m) {

                // Initilize display
                if(initDisplay){
                    m_workDC.clearRect(0, 0, ox, oy);  // Clear all canvas
                    Xpoint = stdW;
                    initDisplay = 0;
                }

                // Display ECG labels
                if(Xpoint == stdW){
                    m_workDC.clearRect(0   , 0, stdW-1, oy);  // Clear left label area
                    m_workDC.clearRect(ox/2, 0, stdW-1, oy);  // Clear right label area

                    for (let q = 0; q < 12; q++) {
                        if(q <6){
                            shiftWidth = stdW/2;      shiftIndex = 0;
                        }else{
                            shiftWidth = stdW/2+ox/2; shiftIndex = -6;
                        }
                        m_workDC.fillText(ecgLabel[q], shiftWidth, Voffset[q + shiftIndex]-10, 20);
                    }
                }



                // ***** Detects maximum and minimum data *****
                for (let q = 0; q < 12; q++) {

					// ***** Inst and lead calculations process *****
					if(instTimer>0){
						Vnew[q] = 0;			// Inst data
					}else{
                        let tmp;
                        switch(q){
                            case 0:  // I
                            case 1:  // II
                                tmp = data[m][q];
                                break;
                            case 2:  // III = II - I
                                tmp = data[m][1] - data[m][0];
                                break;
                            case 3:  // aVR = -(I + II) / 2
                                tmp = -(data[m][0] + data[m][1])/2;
                                break;
                            case 4:  // aVL = I - II / 2
                                tmp = data[m][0] - data[m][1]/2;
                                break;
                            case 5:  // aVF = II - I / 2
                                tmp = data[m][1] - data[m][0]/2;
                                break;
                            case 6:
                            case 7:
                            case 8:
                            case 9:
                            case 10:
                            case 11:  // VI - 6
                                tmp = data[m][q-4];
                                break;
                        }

                        // ***** Add Cal during Cal timer > 0 ****
                        //  205  ___ 3mm(160 to 40ms))
                        //      |   |
                        //   0 _|   |_ 
                        //   1mm     1mm
                        if(calTimer>0){
                            if(calTimer<=160 && calTimer>40){
                                tmp=205;
                            }else{
                                tmp=0;
				            }
                        }

                        Vnew[q] = gain * tmp / 8;		// 12 lead waveforms (I to V6)
					}

                    if (yMax[q] <= Vnew[q]) { yMax[q] = Vnew[q]; }
                    if (yMin[q] >= Vnew[q]) { yMin[q] = Vnew[q]; }
                }

                // ***** Cal timer check *****
                if(calTimer>0){
                    calTimer-=1;
                }


                //***** Erase and draw waveforms *****/
                if ((Xpoint + 1) <= WaveSteps) {

                    // Draw rease line
                    if (Xpoint + 20 >= ox/2) {
                        i = Xpoint + 20 - ox/2 + stdW - 1;
                    } else {
                        i = Xpoint + 20;
                    }
                    m_workDC.clearRect(i       , 0, 1, oy);  // Left area
                    m_workDC.clearRect(i + ox/2, 0, 1, oy);  // Right area

                    // Draw waveforms
                    for (q = 0; q < 12; q++) {

                        if (yMax[q] == yMin[q]) { yMax[q]++; }

                        if(q <6){
                            shiftWidth = 0; shiftIndex = 0;
                        }else{
                            shiftWidth = ox/2; shiftIndex = -6;
                        }

                        m_workDC.beginPath();

                        m_workDC.moveTo(Xpoint + shiftWidth, (Voffset[q + shiftIndex] - yMax[q] - PenSize));
                        m_workDC.lineTo(Xpoint + shiftWidth, (Voffset[q + shiftIndex] - yMin[q]));

                        //                        m_workDC.lineCap = "round";
                        m_workDC.lineJoin = "round";
                        m_workDC.lineWidth = 1.0;
//                      m_workDC.strokeStyle = "rgb(" + String(color[q][0]) + "," + String(color[q][1]) + "," + String(color[q][2]) + ")";
                        m_workDC.strokeStyle = "rgb(0, 255, 0)";
                        m_workDC.stroke();

                        yMin[q] = Vnew[q];
                        yMax[q] = Vnew[q];
                    }

                    Xpoint += 0.1 *dSpeed / displayResolution;
                }
                WaveSteps += WaveStepsPerDot * dSpeed;

                // Set pointers to the left point of windows
                if (Xpoint > ox/2) {
                    WaveSteps = stdW;
                    Xpoint = stdW;
                    //               DisplayLables();
                }
            }
        }

