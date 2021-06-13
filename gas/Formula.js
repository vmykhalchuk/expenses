// Here we collect formulas used in Spreadsheet

/*

=
ARRAYFORMULA(SUM(
  IF(
    InTx!$K$3:$K=$A16,
    IF(
      InTx!$L$3:$L="n",
      IF(
        InTx!$J$3:$J=C_TT_MONO_WHITE,
        IF(
          InTx!$D$3:$D<0,
          FLOOR(InTx!$D$3:$D),
          InTx!$D$3:$D
        ),
        InTx!$D$3:$D
      ),
    )
  )
))

*/

/* Week current
=
ARRAYFORMULA(SUM(
  IF(
    InTx!$C$3:$C>C_CURR_WEEK_START,
    IF(
      InTx!$K$3:$K=C_ET_WEEK,
      IF(
        InTx!$J$3:$J=C_TT_MONO_WHITE,
        IF(
          InTx!$D$3:$D<0,
          FLOOR(InTx!$D$3:$D),
          InTx!$D$3:$D
        ),
        InTx!$D$3:$D
      )
    )
  )
))
*/

/* Week previous
=
ARRAYFORMULA(SUM(
  IF(
    InTx!$C$3:$C>C_PREV_WEEK_START,
    IF(
      InTx!$K$3:$K=C_ET_WEEK,
      IF(
        InTx!$J$3:$J=C_TT_MONO_WHITE,
        IF(
          InTx!$D$3:$D<0,
          FLOOR(InTx!$D$3:$D),
          InTx!$D$3:$D
        ),
        InTx!$D$3:$D
      )
    )
  )
))
-$B$23
*/

/* Week previous previous
=
ARRAYFORMULA(SUM(
  IF(
    InTx!$C$3:$C>C_PREV_PREV_WEEK_START,
    IF(
      InTx!$K$3:$K=C_ET_WEEK,
      IF(
        InTx!$J$3:$J=C_TT_MONO_WHITE,
        IF(
          InTx!$D$3:$D<0,
          FLOOR(InTx!$D$3:$D),
          InTx!$D$3:$D
        ),
        InTx!$D$3:$D
      )
    )
  )
))
-$B$24-$B$23
*/
//=ARRAYFORMULA(SUM(IF(InTx!$C$3:$C>C_PREV_PREV_WEEK_START,IF(InTx!$K$3:$K=C_ET_WEEK,IF(InTx!$J$3:$J=C_TT_MONO_WHITE,FLOOR(InTx!$D$3:$D),InTx!$D$3:$D)))))-$B$24-$B$23