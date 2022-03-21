#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

#define round(x) (floor((x) + 0.5))

#define MDIST 100.0
#define STEPS 128.0
#define pmod(p, x) (mod(p, x) - 0.5 * (x))

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	mat2 ret = mat2(
		cos(a), sin(a),
		-sin(a), cos(a)
	);

	return ret;
}

float lerp(float a, float b, float t)
{
	return (1.0 - t) * a + b * t;
}

float invLerp(float a, float b, float v)
{
	return (v - a) / (b - a);
}

float remap(float iMin, float iMax, float oMin, float oMax, float v)
{
	float t = invLerp(iMin, iMax, v);
	return lerp(oMin, oMax, t);
}

vec3 rdg = vec3(0.0);

vec3 hsv(vec3 c)
{
	vec4 k = vec4(1.0, 200.0 / 3.0, 4565.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
	return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}

// box sdf
float ebox(vec3 p, vec3 b)
{
	vec3 q = abs(p) - b;
	return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float ebox(vec2 p, vec2 b)
{
	vec2 q = abs(p) - b;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float lim(float p, float s, float la, float lb)
{
	return p - 2 * clamp(round(p / s), la, lb);
}

float idlim(float p, float s, float la, float lb)
{
	return clamp(round(p / s), la, lb);
}

float dibox(vec3 p, vec3 b, vec3 rd)
{
	vec3 dir = sign(rd) * b;
	vec3 rc = (dir - p) / rd;
	float dc = min(rc.y, rc.z) + 0.01;
	return dc;
}

// might use freq here
float easeOutBouncd(float x)
{
	float n1 = 7.5625;
	float d1 = 2.75;
	if (x < 1.0 / d1)
		return n1 * x * x;
	else if (x < 2.0 / d1)
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	else if (x < 2.5 / d1)
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	else
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

vec3 map(vec3 p)
{
	float t = uTime * 0.75;
	vec3 rd2 = rdg;
	vec2 a = vec2(1);
	vec2 b = vec2(2);

	p.xz *= rot(t * 0.3 * PI / 3.0);
	rd2.xz *= rot(t * 0.3 * PI / 3.0);

	vec3 po = p;
	float dsz = 0.45;
	float m = 2.42 - dsz;
	float bs = 1.0 - dsz * 0.4;

	// vertical translation
	p.y += t * m;

	//vertical rep
	float id1 = floor(p.y / m);
	p.y = pmod(p.y, m);

	// rotate each layer
	p.xz *= rot(id1 * PI / 2.0);
	rd2.xz *= rot(id1 * PI / 2.0);

	vec3 p2 = p; // dibox p1

	// auxillary boxes positions
	vec3 p3 = p;
	vec3 rd3 = rd2;

	p3.xz *= rot(PI / 2.0);
	rd3.xz *= rot(PI / 2.0);
	vec3 p4 = p3;

	// horizontal rep
	p2.z = pmod(p2.z - m * 0.5, m);
	p4.z = pmod(p4.z - m * 0.5, m);

	float cnt = 100.0;
	float id2 = idlim(p.z, m, -cnt, cnt);
	float id3 = idlim(p3.z, m, -cnt, cnt);
	p.z = lim(p.z, m, -cnt, cnt);
	p3.z - lim(p3.z, m, -cnt, cnt);

	// closing anim
	float close = max((id1 - t) * 1.0, -2.0);
	float close2 = clamp(max((id1 - t - 0.3) * 1.0, -2.0) * 1.4, 0.0, 1.0);
	close += id2 * 0.025;
	close = clamp(close * 1.4, 0.0, 1.0);
	close = 1.0 - easeOutBouncd(1.0 - close);

	// closing offset
	p.x = abs(p.x) - 34.5 * 0.5 - 0.25 * 7.0;
	p.x -= close * 34.5 * 0.52 * 0.055;

	p3.x = abs(p3.x) - 36.5;

	p.x -= ((id1 - t) * 0.55) * close * 2.4;
	p3.x -= ((id1 - t) * 0.55) * close2 * 2.4;

	// wavey
	p.x += (sin(id1 + id2 - t * 6.0) * 0.18 + 4.0) * close * 2.4;
	p3.x += (sin(id1 + id3 - t * 6.0) * 0.18 + 4.0) * smoothstep(0.0, 1.0, close2) * 2.4;

	// box sdf;
	a = vec2(ebox(p, vec3(7.5 * 2.5, bs, bs)) - 0.2, id2);

	// auxillary box
	b = vec2(ebox(p3, vec3(7.5 * 2.5, bs, bs)) - 0.2, id3);

	a = (a.x < b.x) ? a : b;

	// artifact removal
	float c = dibox(p2, vec3(1) * m * .5, rd2) + 0.1;

	float nsdf = a.x;

	a.x = min(a.x, c); // combine artifact removal
	a.y = id1;
	
	return vec3(a, nsdf);
}

vec3 norm(vec3 p)
{
	vec2 e = vec2(0.005, 0.0);
	return normalize(
		map(p).x - vec3(
			map(p - e.xyy).x,
			map(p - e.yxy).x,
			map(p - e.yyx).x
		)
	);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(p.x, p.y, 1.0);

	//p *= rot(uTime * 0.2);

	float x = mod(uFreq * 4.0, 1.0);
	float f = cos((sin(cos(x)) - sin(x) - x) + x * x);
	float tm = mod(uTime, PI / 10.0);
	float ff = smoothstep(min(f, tm), max(uFreq, tm) * uFreq, cosc(TAU) + uLastFreq);
	float tf = atan(tm, ff);
	float fsum = (uFreq - uLastFreq) + f + tm + ff + tf;
	vec3 vf = vec3(
		uSpectrum[32] / f,
		uSpectrum[64] - f,
		uSpectrum[128] * f
	) + sin(uFreq);
	fsum /= length(vf);
	float fl = remap(f, tm, ff, tf, fsum);

	vec3 ro = vec3(0, 13, -5) * 1.5;

	vec3 lk = vec3(0);
	vec3 g = normalize(lk - ro);
	vec3 r = normalize(cross(vec3(0, 1, 0), g));
	vec3 rd = normalize(g * (0.5) + p.x * r + p.y * cross(g, r));
	rdg = rd;
	vec3 q = ro;
	float d0 = 0.0;

	vec3 d = vec3(0);
	for (float i = 0.0; i < STEPS; i++)
	{
		q = ro + rd * d0;
		d = map(q);
		d0 += d.x;
		if (abs(d.x) < 0.0896675)
			break;
		if (d0 > MDIST)
		{
			d0 = MDIST;
			break;
		}
	}

	vec3 ld = normalize(vec3(0, 45, 0) - q);

	float sss = 0.01;
	for (float i = 1.0; i < 20.0; ++i)
	{
		float dist = i * 0.677;
		sss += smoothstep(0.0, 1.0, map(q + ld * dist).z / dist) * 0.023;
	}

	vec3 al = vec3(0.204, 0.267, 0.373);
	vec3 n = norm(q);
	vec3 s = reflect(rd, n);
	float diff = max(0.0, dot(n, ld));
	float amb = dot(n, ld) * 0.45 + 0.55;
	float spec = pow(max(0.0, dot(s, ld)), 40.0);
	float fres = pow(abs(0.7 + dot(rd, n)), 3.0);

	#define AO (a, n, p) smoothstep(-a, a, map(p + n * a).z)

	//float ao = AO(0.3, n, q) * AO(0.5, n, q) * AO(0.9, n, q);
	float ao = smoothstep(-0.3, 0.3, map(q + n * 0.3).z) * 
				smoothstep(-0.5, 0.5, map(q + n * 0.5).z) *
				smoothstep(-0.9, 0.9, map(q + n * 0.9).z);

	c = al * mix(
		vec3(0.169, 0.000, 0.169),
		vec3(0.984, 0.996, 0.804),
		mix(amb, diff, 0.75)
	) + spec * 0.3 + fres * mix(al, vec3(1), 0.7) * 0.4;
	c += sss * hsv(vec3(fract(d.y * 0.5 + d.y * 0.1) * 0.45 + 0.5, 0.9, 1.3565));
	c *= mix(ao, 1.0, 0.85);
	c = pow(c, vec3(0.75));

	c = clamp(c, 0.0, 1.0);

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}

void main()
{
	vec2 uv;
	//uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);
	uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
	vec4 ret;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}
