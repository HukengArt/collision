

export function vecAngle2D(vec0, vec1) {
    return Math.acos((vec0[0] * vec1[0] + vec0[1] * vec1[1]) / (Math.sqrt(Math.pow(vec0[0], 2) + Math.pow(vec0[1], 2)) * Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2))));
  }
