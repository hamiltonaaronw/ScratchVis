#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;

#define cosc(x) cos(x) / x
#define sinc(x) sin(x) / x

out vec4 retColor;

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec3 hsv2rgb(float h, float s, float v)
{
	return ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
}

float t = 0.0;
vec3 glw;

// cube
float bx(vec3 p, vec3 s)
{
	vec3 q = abs(p) - s;
	return min(max(q.x, max(q.y, q.z)), 0.0) + length(max(q, 0.0));
}

// cylinder
float cyl(vec3 p, float r)
{
	return length(p.xz) - r;
}

// torus
float tor(vec3 p, vec2 v)
{
	vec2 q = vec2(length(p.xz) - v.x, p.y);
	return length(q) - v.y + uFreq;
}

// crystal
float crys(vec3 p, vec3 q)
{
	float f = cos((sin(cos(uFreq)) - sin(uFreq) + uFreq * uFreq));
	float fs = mod(uTime, 1.0 - f);
	float x = mod(uFreq * 4.0, 1.0);
	float ff = cos((sin(cos(x)) - sin(x) - x) + x * x);

	for (float i = 0.0; i < 4.0; i++)
	{
		q.xy *= rot(i - 2.0 + 0.1);
		q.xy = abs(q.xy) - i * f;
		q.xy = abs(q.xy) - (2.1 - f);
		q.yz *= rot(smoothstep(min(ff, i), max(ff, i) + uFreq, sinc(TAU)) * 0.25);
	}

	float b = bx(q * 0.9, vec3(2.0)) - 0.03;
	b = mix(b, bx(p, vec3(1.0)), 0.5);

	float g = length(p);
	glw += 0.01 / (0.01 + g * g) * 
		mix(vec3(1.0, 0.0, 0.2), vec3(0.2, 0.5, 1.0), sin(t / 4.0) * 0.5 + 0.5); // glow
	return b;
}

// map
vec2 mp(vec3 p)
{
	float i = clamp(10.0 - t, 0.0, 10.0); // smooth morph
	float z = (sin(t / 3.0) * 0.5 + 0.5) * 1.5; // slow z warping
	float ta = 1.0 - pow(1.0 - mod(t, 3.0) * 0.3, 2.0);

	vec3 co = mix(vec3(1.0, 0.0, 0.2), vec3(0.2, 0.5, 1.0), sin(-t / 4) * 0.5 + uFreq);
	vec3 q = p - vec3(0.0, 0.0, i + z);
	vec3 r = p;

	q.xy *= rot(-t / 3.0);
	r.xy *= rot(t * 0.1);

	vec2 crystal = vec2(crys(r, q), 1.0);
	q = p;
	q.yz *= rot(1.57);

	float torus = tor(q - vec3(0.0, 12.0 * ta, 0.0), vec2(16.0 * ta, 0.01));
	crystal.x = min(crystal.x, torus);
	glw += mod(uFreq * 5.0, 0.01) / (0.01 + torus) * co;
	q = p - vec3(0.0, 9.0, 12.0);
	q.x = abs(q.x) - 11.0;
	q.x *= 0.3;

	float br = bx(q, vec3(0.5, 30.0, 50.0)) - 0.2; // background walls
	q.z -= mod(t * 5.0, 20.0) + 5.0;
	q.z = abs(q.z) - 10.0;
	q.z = abs(q.z) - 10.0;

	float g = bx(q, vec3(0.8, 30.0, 2.0)); // bars glow amount
	br = min(br, g);

	vec3 coInv = vec3(1.0, 1.0, 1.0) - co;
	glw += 0.01 / (0.01 + g) * coInv * 0.2;
	r = p;
	r.y = abs(r.y) - 5.0; // mirror position on Y axis

	vec2 flr = vec2(bx(r - vec3(0.0, 4.0, 0.0), vec3(50.0, 1.0, 100.0)), 2.0); // floor/roof
	flr.x = min(flr.x, br); // add side walls to raymarch

	return flr.x < crystal.x ? flr : crystal;
}

// raymarching with distance field
vec2 tr(vec3 ro, vec3 rd, float f)
{
	vec2 d = vec2(0.0); // distance

	for (int i = 0; i < 256; i++)
	{
		vec3 p = ro + rd * d.x;
		vec2 s = mp(p);
		s.x *= f;
		d.x += s.x;
		d.y = s.y;

		// break if something is reached/went too far
		if (d.x > 64.0 || s.x < 0.001)
			break;
	}

	if (d.x > 64.0)
		d.y = 0.0;
	
	return d;
}

// normalize
vec3 nm(vec3 p)
{
	vec2 e = vec2(0.001, 0.0);
	return normalize(
		mp(p).x - vec3(
			mp(p - e.xyy).x,
			mp(p - e.yxy).x,
			mp(p - e.yyx).x
		)
	);
}

vec4 px(vec4 h, vec3 rd, vec3 n)
{
	vec4 bg = vec4(0.1, 0.1, 0.1, 1.0); // background

	if (h.a == 0.0)
		return bg;

	vec4 a = h.a == 1.0 ? vec4(0.0, 1.0, 1.0, 0.2) : vec4(0.1, 0.1, 0.15, 1.0);

	float d = dot(n, -rd);
	float dd = max(d, 0.0);

	float f = pow(1.0 - d, 4.0);
	float s = (pow(abs(dot(reflect(rd, n), -rd)), 40.0) * 10.0);

	if (h.a > 1.0)
		s *= 0.025;

	float ao = clamp(1.0 - mp(h.xyz + n * 0.1).x * 14.0, 0.0, 1.0) * 0.9;

	return vec4(mix(a.rgb * (dd - ao) + s, bg.rgb, f), a.a);
}

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	p *= rot(uTime * 0.5);

	t = uTime * 4.0;

	float ts = 1.0;
	float io = 1.14;

	float tm = mod(uTime, PI / 10.0);
	float f = smoothstep(min(uFreq, tm), max(uFreq, tm) * uFreq, sinc(TAU) + uLastFreq);
	f += sin(uTime / TAU);

	vec3 ro = vec3(0.0, 0.0, -7.5 - f); // cam pos
	vec3 rd = normalize(vec3(p, 1.0)); // ray dir
	vec3 oro = ro, 
		 ord = rd, 
		 cc = vec3(0.0);
	vec3 cp, cn, rc;


	for (int i = 0; i < 4; i++)
	{
		vec2 fh = tr(oro, ord, 1.0); // find front of object
		cp = oro + ord * fh.x;
		cn = nm(cp); // position and normal of hit

		vec4 co = px(vec4(cp, fh.y), ord, cn); // pixel color

		if (fh.y == 0.0 || co.a == 1.0)
		{
			cc = mix(cc, co.rgb, ts) * uFreq;
			break;
		}

		ro = cp - cn * 0.01;
		rd = refract(ord, cn, 1.0 / io);

		vec2 bh = tr(ro, rd, -1.0); // inverted distance
		cp = ro + rd * bh.x; // position
		cn = nm(cp); // normal
		oro = cp + cn * 0.01;
		ord = refract(rd, -cn, io);

		if (dot(ord, ord) == 0.0)
			ord = reflect(rd, -cn); // internal refraction

		// update color
		cc = mix(cc, co.rgb, ts);
		ts -= co.a;

		if (ts <= 0.0)
			break;
	}

	c = cc + glw;
	c += hsv2rgb(c.r, c.g, c.b).z;

	ret = uFreq > 0.001 ? c : vec3(0.0);

	return ret;
}

void main()
{	
	vec4 ret;
	vec2 uv;

	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y) / 2.0;

	ret = vec4(col(uv), 1.0);

	retColor = ret;
}